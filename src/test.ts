import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

declare const require: {
  context(
    path: string,
    deep?: boolean,
    filter?: RegExp
  ): {
    keys(): string[];
    <T>(id: string): T;
  };
};

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

const context =
  (import.meta as any).webpackContext?.('./', {
    recursive: true,
    regExp: /\.spec\.ts$/,
  }) ?? require.context('./', true, /\.spec\.ts$/);

context.keys().forEach((key: string) => context(key));
