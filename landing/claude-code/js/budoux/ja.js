/* BudouX (Apache-2.0, Google LLC): Japanese model only. Copied from budoux@0.7.0/module. */
import { model } from './data/models/ja.js';
import { HTMLProcessingParser } from './html_processor.js';
export const parser = new HTMLProcessingParser(model);
