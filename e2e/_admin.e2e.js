// e2e.js
const { Builder, By, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

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
  await driver.executeScript("arguments[0].scrollIntoView({block: 'center', inline: 'center'});", element);
  await sleep(150);
  await driver.executeScript("arguments[0].click();", element);
}

(async function adminClientsE2E() {
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
    `--user-data-dir=${require('path').join(__dirname, 'tmp-chrome-profile')}`,
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
    await driver.get('http://localhost:4200/login');

    // 1) TEST ADMIN LOGIN
    await driver.findElement(By.name('email')).sendKeys('crud@crud.crud');
    await driver.findElement(By.name('password')).sendKeys('adminc');
    let loginBtn = await driver.findElement(By.css('button[type="submit"]'));
    await safeClick(driver, loginBtn);

    await driver.wait(until.urlContains('/admin'), 7000);
    logPass('admin login test passed');
    await sleep(1000);

    // 2) TEST ADMIN DASHBOARD
    await driver.wait(until.elementLocated(By.css('.stat-cards')), 5000);
    logPass('dashboard stats loaded test passed');
    await sleep(1000);

    // 3) TEST CLIENTES NAVIGATION
    const clientesBtn = await driver.wait(
      until.elementLocated(By.xpath("//nav//button[.//span[contains(normalize-space(.),'Clientes')]]")),
      5000
    );
    await safeClick(driver, clientesBtn);

    await driver.wait(until.elementLocated(By.xpath("//h1[contains(normalize-space(.),'Gestión de Clientes')]")), 5000);

    await driver.wait(until.elementLocated(By.css('.table')), 5000);
    logPass('clientes cargados correctamente test passed');
    await sleep(1000);

    // 4) TEST CLIENTE CREADO
    const cedula = `E2E${Date.now().toString().slice(-6)}`;
    const nombre = 'E2E Test';
    const direccion = 'Calle E2E 123';
    const correo = `e2e-${Date.now().toString().slice(-4)}@test.local`;
    const telefono = '300123' + Math.floor(Math.random() * 9000 + 1000).toString();

    const nuevoBtn = await driver.findElement(By.xpath("//button[contains(normalize-space(.),'Nuevo Cliente')]"));
    await safeClick(driver, nuevoBtn);
    await sleep(500);

    await driver.findElement(By.id('cedula')).sendKeys(cedula);
    await driver.findElement(By.id('nombre')).sendKeys(nombre);
    await driver.findElement(By.id('direccion')).sendKeys(direccion);
    await driver.findElement(By.id('correo')).sendKeys(correo);
    await driver.findElement(By.id('telefono')).sendKeys(telefono);

    let clientSubmitBtn = await driver.findElement(By.css('form button[type="submit"]'));
    await safeClick(driver, clientSubmitBtn);

    await driver.wait(until.elementLocated(By.xpath(`//td[normalize-space(text())='${cedula}']`)), 7000);
    logPass('cliente creado test passed');
    await sleep(1000);

    // 5) TEST CLIENTE BUSCADO
    const searchInput = await driver.findElement(By.xpath("//input[contains(@placeholder,'Buscar por cédula o nombre')]"));
    await searchInput.clear();
    await searchInput.sendKeys(cedula);
    await sleep(500);

    const found = await driver.findElements(By.xpath(`//td[normalize-space(text())='${cedula}']`));
    if (!found || found.length === 0) {
      throw new Error('Cliente creado no encontrado en la lista tras búsqueda');
    }
    logPass('cliente buscado test passed');
    await sleep(1000);

    // 6) TEST CLIENTE EDITADO
    const editBtnXpath = `//tr[td[normalize-space(text())='${cedula}']]//button[contains(normalize-space(.),'Editar')]`;
    let editBtn;
    try {
      editBtn = await driver.findElement(By.xpath(editBtnXpath));
    } catch (e) {
      editBtn = await driver.findElement(
        By.xpath(`//tr[td[normalize-space(text())='${cedula}']]//button[contains(translate(@aria-label,'EDT','edt'),'editar') or contains(translate(@title,'EDT','edt'),'editar')]`)
      );
    }
    await safeClick(driver, editBtn);
    await sleep(500);

    const newNombre = nombre + ' Editado AQUI PROBANDO';
    const nombreInput = await driver.findElement(By.id('nombre'));
    await nombreInput.clear();
    await nombreInput.sendKeys(newNombre);
    let editClientSubmit = await driver.findElement(By.css('form button[type="submit"]'));
    await safeClick(driver, editClientSubmit);

    await driver.wait(until.elementLocated(By.xpath(`//tr[td[normalize-space(text())='${cedula}']]/td[normalize-space(text())='${newNombre}']`)), 7000);
    logPass('cliente editado test passed');
    await sleep(1000);

    // 7) TEST CLIENTE ELIMINADO
    try {
      const delBtnXpath = `//tr[td[normalize-space(text())='${cedula}']]//button[contains(normalize-space(.),'Eliminar')]`;
      let delBtn;
      try {
        delBtn = await driver.findElement(By.xpath(delBtnXpath));
      } catch (e) {
        delBtn = await driver.findElement(
          By.xpath(`//tr[td[normalize-space(text())='${cedula}']]//button[contains(translate(@aria-label,'DEL','del'),'eliminar') or contains(translate(@title,'DEL','del'),'eliminar')]`)
        );
      }
      await safeClick(driver, delBtn);
      try {
        const alert = await driver.switchTo().alert();
        await alert.accept();
      } catch (e) {
      }
      await driver.wait(async () => {
        const rows = await driver.findElements(By.xpath(`//td[normalize-space(text())='${cedula}']`));
        return rows.length === 0;
      }, 7000);
      logPass(`cliente eliminado test passed: ${cedula}`);
      await sleep(1000);
    } catch (e) {
      throw new Error('No se pudo eliminar el cliente: ' + (e && e.message ? e.message : e));
    }

    // 8) IR A SECCIÓN PRODUCTOS
    const productosBtn = await driver.wait(
      until.elementLocated(By.xpath("//nav//button[.//span[contains(normalize-space(.),'Productos')]]")),
      5000
    );
    await safeClick(driver, productosBtn);
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(normalize-space(.),'Gestión de Productos')]")), 5000);
    await sleep(800);

    // 9) CREAR NUEVO PRODUCTO
    const prodName = `E2EP${Date.now().toString().slice(-6)}`;
    const prodDesc = 'E2E Producto';
    const prodPrecio = '123';
    const prodExist = '5';
    const prodPeso = '1';
    try {
      const nuevoProdBtn = await driver.findElement(By.xpath("//button[contains(normalize-space(.),'Nuevo Producto')]"));
      await safeClick(driver, nuevoProdBtn);
      await sleep(500);

      await driver.findElement(By.id('pNombre')).sendKeys(prodName);
      await driver.findElement(By.id('pDescripcion')).sendKeys(prodDesc);
      await driver.findElement(By.id('pPrecio')).sendKeys(prodPrecio);
      await driver.findElement(By.id('pExistencia')).sendKeys(prodExist);
      await driver.findElement(By.id('pPeso')).sendKeys(prodPeso);
      let prodSubmitBtn = await driver.findElement(By.css('form button[type="submit"]'));
      await safeClick(driver, prodSubmitBtn);

      await driver.wait(until.elementLocated(By.xpath(`//td[normalize-space(text())='${prodName}']`)), 7000);
      logPass(`producto creado test passed: ${prodName}`);
      await sleep(1000);
    } catch (e) {
      throw new Error('Error creando producto: ' + (e && e.message ? e.message : e));
    }

    await sleep(500);

    // 10) BUSCAR PRODUCTO
    try {
      const prodSearch = await driver.findElement(By.xpath("//input[contains(@placeholder,'Buscar por nombre o descripción')]"));
      await prodSearch.clear();
      await prodSearch.sendKeys(prodName);
      await sleep(500);
      const foundProd = await driver.findElements(By.xpath(`//td[normalize-space(text())='${prodName}']`));
      if (!foundProd || foundProd.length === 0) {
        throw new Error('Producto creado no encontrado tras búsqueda');
      }
    } catch (e) {
      throw new Error('Error buscando producto: ' + (e && e.message ? e.message : e));
    }

    // 11) EDITAR PRODUCTO
    const prodNewName = prodName + ' EDIT';
    try {
      const editProdXpath = `//tr[td[normalize-space(text())='${prodName}']]//button[contains(normalize-space(.),'Editar')]`;
      let editProdBtn;
      try {
        editProdBtn = await driver.findElement(By.xpath(editProdXpath));
      } catch (e) {
        editProdBtn = await driver.findElement(
          By.xpath(`//tr[td[normalize-space(text())='${prodName}']]//button[contains(translate(@aria-label,'EDT','edt'),'editar') or contains(translate(@title,'EDT','edt'),'editar')]`)
        );
      }
      await safeClick(driver, editProdBtn);
      await sleep(500);
      const nombreProdInput = await driver.findElement(By.id('pNombre'));
      await nombreProdInput.clear();
      await nombreProdInput.sendKeys(prodNewName);
      let prodEditSubmit = await driver.findElement(By.css('form button[type="submit"]'));
      await safeClick(driver, prodEditSubmit);

      await driver.wait(until.elementLocated(By.xpath(`//tr[td[normalize-space(text())='${prodNewName}']]`)), 7000);
      logPass(`producto editado test passed: ${prodNewName}`);
      await sleep(1000);
    } catch (e) {
      throw new Error('Error editando producto: ' + (e && e.message ? e.message : e));
    }

    // 12) ELIMINAR PRODUCTO
    try {
      const delProdXpath = `//tr[td[normalize-space(text())='${prodNewName}']]//button[contains(normalize-space(.),'Eliminar')]`;
      let delProdBtn;
      try {
        delProdBtn = await driver.findElement(By.xpath(delProdXpath));
      } catch (e) {
        delProdBtn = await driver.findElement(
          By.xpath(`//tr[td[normalize-space(text())='${prodNewName}']]//button[contains(translate(@aria-label,'DEL','del'),'eliminar') or contains(translate(@title,'DEL','del'),'eliminar')]`)
        );
      }
      await safeClick(driver, delProdBtn);
      try {
        const alert2 = await driver.switchTo().alert();
        await alert2.accept();
      } catch (e) {}
      await driver.wait(async () => {
        const rows = await driver.findElements(By.xpath(`//td[normalize-space(text())='${prodNewName}']`));
        return rows.length === 0;
      }, 7000);
      logPass(`producto eliminado test passed: ${prodNewName}`);
      await sleep(1000);
    } catch (e) {
      throw new Error('Error eliminando producto: ' + (e && e.message ? e.message : e));
    }

    // 13) NAVEGAR A FACTURAS Y VERIFICAR
    try {
      const facturasBtn = await driver.wait(
        until.elementLocated(By.xpath("//nav//button[.//span[contains(normalize-space(.),'Facturas')]]")),
        5000
      );
      await safeClick(driver, facturasBtn);
      await driver.wait(until.elementLocated(By.xpath("//h1[contains(normalize-space(.),'Gestión de Facturas')]")), 5000);
      await driver.wait(until.elementLocated(By.css('.table')), 5000);
      logPass('facturas cargadas test passed');
      await sleep(1000);
    } catch (e) {
      throw new Error('Error navegando/verificando facturas: ' + (e && e.message ? e.message : e));
    }

    // 14) NAVEGAR A CARRITOS Y VERIFICAR
    try {
      const carritosBtn = await driver.wait(
        until.elementLocated(By.xpath("//nav//button[.//span[contains(normalize-space(.),'Carritos')]]")),
        5000
      );
      await safeClick(driver, carritosBtn);
      await driver.wait(until.elementLocated(By.xpath("//h1[contains(normalize-space(.),'Gestión de Carritos')]")), 5000);
      await driver.wait(until.elementLocated(By.css('.table')), 5000);
      logPass('carritos cargados test passed');
      await sleep(1000);
    } catch (e) {
      throw new Error('Error navegando/verificando carritos: ' + (e && e.message ? e.message : e));
    }

    logPass('ADMIN e2e test passed');
  } catch (err) {
    logFail(`ADMIN e2e test failed: ${err && err.message ? err.message : err}`);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
})();
