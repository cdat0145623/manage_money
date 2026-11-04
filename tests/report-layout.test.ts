import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("mobile report month filters stack without intrinsic grid tracks", async () => {
    const css = await readFile(new URL("../src/style.css", import.meta.url), "utf8");
    const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
    const mobile = css.match(/@media \(max-width: 680px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

    assert.match(mobile, /\.report-toolbar \.range-filter\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1;/);
    assert.match(mobile, /\.report-toolbar label\s*\{[\s\S]*?display:\s*flex;/);
    assert.match(mobile, /flex-direction:\s*column;/);
    assert.match(mobile, /align-items:\s*stretch;/);
    assert.match(mobile, /\.report-toolbar input\[type="month"\]\s*\{[\s\S]*?-webkit-appearance:\s*none;/);
    assert.match(mobile, /inline-size:\s*100%;/);
    assert.match(mobile, /max-inline-size:\s*100%;/);
    assert.match(app, /className="month-input-shell"/);
    assert.match(mobile, /\.month-input-shell\s*\{[\s\S]*?overflow:\s*hidden;/);
    assert.match(mobile, /\.month-input-shell\s*\{[\s\S]*?width:\s*100%;/);
    assert.match(mobile, /height:\s*40px;/);
    assert.match(mobile, /line-height:\s*40px;/);
    assert.match(mobile, /::-webkit-date-and-time-value/);
});

test("mobile form selects keep an explicit touch height", async () => {
    const css = await readFile(new URL("../src/style.css", import.meta.url), "utf8");

    assert.match(
        css,
        /@media \(max-width: 680px\) \{[\s\S]*?\.form-body select\s*\{[\s\S]*?height:\s*56px;[\s\S]*?min-height:\s*56px;/,
    );
});
