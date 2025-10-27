const { Builder, By, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');

const BASE_URL = 'http://localhost:4200';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function logPass(msg) {
  console.log(`${GREEN}%s${RESET}`, msg);
}
function logFail(msg) {
  console.error(`${RED}%s${RESET}`, msg);
}
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function safeClick(driver, element) {
  await driver.executeScript(
    "arguments[0].scrollIntoView({block: 'center', inline: 'center'});",
    element
  );
  await sleep(150);
  await driver.executeScript('arguments[0].click();', element);
}

async function suppressNativeAlerts(driver) {
  await driver.executeScript(
    'window.alert = function(){}; window.confirm = function(){return true;}; window.prompt = function(){return null;};'
  );
}

async function trySafeClick(driver, element, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    try {
      await safeClick(driver, element);
      return;
    } catch (err) {
      try {
        const al = await driver.switchTo().alert();
        await al.accept();
      } catch (e) {
      }
      if (i === attempts - 1) throw err;
      await sleep(200);
    }
  }
}

(async function userFlowE2E() {
  const options = new chrome.Options().addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--disable-features=PushMessaging,BackgroundNetworking,TranslateUI',
    '--disable-component-update',
    '--disable-default-apps',
    '--no-first-run',
    '--disable-extensions',
    '--disable-notifications',
    '--disable-gcm',
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    `--user-data-dir=${path.join(__dirname, 'tmp-chrome-profile-user')}`,
    '--log-level=3'
  );
  options.excludeSwitches(['enable-automation']);
  options.setUserPreferences({ 'profile.default_content_setting_values.notifications': 2 });

  const prefs = new logging.Preferences();
  prefs.setLevel(logging.Type.BROWSER, logging.Level.SEVERE);

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setLoggingPrefs(prefs)
    .build();

  try {
    // 1) TEST REGISTRO DE USUARIO
    const unique = Date.now().toString().slice(-6);
    const email = `e2e-user-${unique}@test.local`;
    const password = 'e2ePass1';
    await driver.get(`${BASE_URL}/register`);
    await driver.wait(until.elementLocated(By.id('name')), 5000);

    await driver.findElement(By.id('name')).sendKeys('EtoE');
    await driver.findElement(By.id('lastName')).sendKeys('User');
    await driver.findElement(By.id('email')).sendKeys(email);
    await driver.findElement(By.id('phone')).sendKeys('3001234567');
    function randomDigits(len) {
      let s = '';
      for (let i = 0; i < len; i++) {
        s += Math.floor(Math.random() * 10);
      }
      if (s[0] === '0') {
        s = '1' + s.slice(1);
      }
      return s;
    }
    const dniLen = Math.floor(Math.random() * (12 - 8 + 1)) + 8; // 8..12
    const dni = randomDigits(dniLen);
    await driver.findElement(By.id('dni')).sendKeys(dni);
    await driver.findElement(By.id('address')).sendKeys('Calle E2E 1');
    await driver.findElement(By.id('password')).sendKeys(password);
    await driver.findElement(By.id('confirmPassword')).sendKeys(password);

    const submitBtn = await driver.findElement(By.css('form button[type="submit"]'));
    await safeClick(driver, submitBtn);

    await driver.wait(until.urlContains('/login'), 7000);
    logPass('register test passed');
    await sleep(800);

    // 2) TEST LOGIN CON USUARIO CREADO
    await driver.findElement(By.name('email')).clear();
    await driver.findElement(By.name('email')).sendKeys(email);
    await driver.findElement(By.name('password')).clear();
    await driver.findElement(By.name('password')).sendKeys(password);
    const loginBtn = await driver.findElement(By.css('button[type="submit"]'));
    await safeClick(driver, loginBtn);

    await driver.wait(until.urlContains('/products'), 7000);
    logPass('login user test passed');
    await suppressNativeAlerts(driver);
    await sleep(800);

    // 3) TEST ESPERAR CARGA DE LISTA DE PRODUCTOS
    await driver.wait(until.elementLocated(By.css('#product-search')), 7000);
    const firstNameEl = await driver.wait(
      until.elementLocated(By.css('.product-card .name')),
      7000
    );
    const productName = (await firstNameEl.getText()).trim();
    if (!productName) throw new Error('No product name found on product list');

    // 4) TEST BUSCAR PRODUCTO POR NOMBRE
    const searchInput = await driver.findElement(By.id('product-search'));
    await searchInput.clear();
    const partial = productName.split(' ')[0].slice(0, 10);
    await searchInput.sendKeys(partial);
    await sleep(700);

    const matching = await driver.findElements(
      By.xpath(`//h3[contains(normalize-space(.),"${partial}")]`)
    );
    if (!matching || matching.length === 0) throw new Error('Product search returned no results');
    logPass('product search test passed');
    await sleep(600);

    // 5) TEST AÑADIR DOS PRODUCTOS AL CARRITO
    const nameEls = await driver.findElements(By.css('.product-card .name'));
    if (!nameEls || nameEls.length < 2)
      throw new Error('Se requieren al menos 2 productos visibles para esta prueba');

    const products = [];
    for (let i = 0; i < 2; i++) {
      const nEl = nameEls[i];
      const name = (await nEl.getText()).trim();
      const priceEl = await driver.findElement(
        By.xpath(
          `//h3[contains(normalize-space(.),"${name}")]/ancestor::article[1]//div[contains(@class,'price') or contains(@class,'meta')]`
        )
      );
      const priceText = (await priceEl.getText()).trim();
      const priceNum = Number(priceText.replace(/[^\d]/g, '')) || 0;

      products.push({ name, price: priceNum });

      let addBtnFor = null;
      try {
        addBtnFor = await driver.findElement(
          By.xpath(
            `//h3[contains(normalize-space(.),"${name}")]/ancestor::article[1]//button[contains(@aria-label,"Agregar") or contains(normalize-space(.),'Agregar')]`
          )
        );
      } catch (err) {
        addBtnFor = await driver.findElement(
          By.xpath(
            `(//article//button[contains(@class,'btn') and contains(normalize-space(.),'Agregar')])[1]`
          )
        );
      }
      await trySafeClick(driver, addBtnFor);
      await sleep(500);
    }

    logPass('add two products to cart test passed');
    await sleep(600);

    const firstProduct = products[0];

    // 6) IR A CARRITO Y VERIFICAR ITEMS
    let cartLoaded = false;
    try {
      const cartNav = await driver.findElement(
        By.xpath(
          "//a[contains(@class,'nav-link') and (contains(normalize-space(.),'Carrito') or contains(normalize-space(.),'Carrito'))]"
        )
      );
      await safeClick(driver, cartNav);
      await driver.wait(until.elementLocated(By.css('.cart-content')), 5000);
      cartLoaded = true;
    } catch (e) {
      try {
        await driver.get(`${BASE_URL}/cart`);
        await driver.wait(until.elementLocated(By.css('.cart-content')), 4000);
        cartLoaded = true;
      } catch {
        try {
          await driver.get(`${BASE_URL}/carrito`);
          await driver.wait(until.elementLocated(By.css('.cart-content')), 4000);
          cartLoaded = true;
        } catch {
          cartLoaded = false;
        }
      }
    }

    if (!cartLoaded) throw new Error('Cart page not reachable or cart content not found');

    const cartItems = await driver.findElements(By.css('.cart-item'));
    if (!cartItems || cartItems.length < 2)
      throw new Error('Se esperaban 2 items en el carrito tras añadirlos');
    logPass('cart contains 2 items test passed');
    await sleep(500);

    // 7) INCREMENTAR CANTIDAD DEL PRIMER ITEM Y VERIFICAR subtotal y total
    const firstItem = cartItems[0];
    const qtySpan = await firstItem.findElement(By.css('.quantity'));
    const qtyBefore = Number((await qtySpan.getText()).trim());

    const unitPriceEl = await firstItem.findElement(By.css('.unit-price'));
    const unitPriceText = (await unitPriceEl.getText()).trim();
    const unitPrice = Number(unitPriceText.replace(/[^\d]/g, '')) || firstProduct.price || 0;

    const plusBtn = await firstItem.findElement(
      By.xpath(".//button[contains(normalize-space(.),'+') or contains(@class,'qty-btn')][2]")
    );
    await safeClick(driver, plusBtn);
    await sleep(700);

    const qtyAfter = Number((await qtySpan.getText()).trim());
    if (qtyAfter !== qtyBefore + 1)
      throw new Error('La cantidad no incrementó correctamente en el carrito');

    const subtotalEl = await firstItem.findElement(By.css('.subtotal'));
    const subtotalText = (await subtotalEl.getText()).trim();
    const subtotalNum = Number(subtotalText.replace(/[^\d]/g, '')) || 0;
    if (subtotalNum !== unitPrice * qtyAfter)
      throw new Error('Subtotal no coincide con unitPrice * cantidad');

    const totalEl = await driver.findElement(By.css('.total-value'));
    const totalText = (await totalEl.getText()).trim();
    const totalNum = Number(totalText.replace(/[^\d]/g, '')) || 0;
    const remainingItems = await driver.findElements(By.css('.cart-item'));
    let expectedTotal = 0;
    for (const it of remainingItems) {
      const s = await it.findElement(By.css('.subtotal'));
      const t = (await s.getText()).trim();
      expectedTotal += Number(t.replace(/[^\d]/g, '')) || 0;
    }
    if (totalNum !== expectedTotal)
      throw new Error('Total mostrado no coincide con suma de subtotales');
    logPass('increment quantity & totals test passed');
    await sleep(500);

    // 8) ELIMINAR PRIMER ITEM y verificar disminución de items
    const firstProductName = firstProduct.name;
    const removeBtn = await firstItem.findElement(By.css('.remove-btn'));
    await safeClick(driver, removeBtn);
    await sleep(700);
    const gone = await driver.findElements(
      By.xpath(`//h4[contains(normalize-space(.),"${firstProductName}")]`)
    );
    if (gone && gone.length > 0) throw new Error('El item no fue eliminado del carrito');
    logPass('remove single product test passed');
    await sleep(500);

    // 9) VACIAR CARRITO y verificar mensaje de vacío
    const vaciarBtn = await driver.findElement(
      By.xpath(
        "//button[contains(normalize-space(.),'Vaciar carrito') or contains(normalize-space(.),'Vaciar')]"
      )
    );
    await safeClick(driver, vaciarBtn);
    await sleep(700);
    const empty = await driver.findElements(By.css('.empty-cart'));
    if (!empty || empty.length === 0)
      throw new Error('El carrito no quedó vacío tras Vaciar carrito');
    logPass('clear cart test passed');
    await sleep(500);

    logPass('user flow e2e test passed');
  } catch (err) {
    logFail(`user flow e2e test failed: ${err && err.message ? err.message : err}`);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
})();
