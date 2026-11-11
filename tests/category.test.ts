import test from "node:test";
import assert from "node:assert/strict";
import {
    categoryLabel,
    matchesCategory,
    normalizeCategoryName,
} from "../src/domain.ts";

const category = {
    id: "category-1",
    user_id: "user-1",
    name: "Tools",
    archived: false,
    created_at: "2026-11-11T00:00:00.000Z",
};

test("category names are trimmed and internal whitespace is normalized", () => {
    assert.equal(normalizeCategoryName("  Home   office  "), "Home office");
});

test("category labels preserve uncategorized legacy expenses", () => {
    assert.equal(
        categoryLabel({ category_id: "category-1" }, [category]),
        "Tools",
    );
    assert.equal(categoryLabel({ category_id: null }, [category]), "Chưa phân loại");
    assert.equal(
        categoryLabel({ category_id: "missing" }, [category]),
        "Chưa phân loại",
    );
});

test("category filter matches assigned and uncategorized expenses", () => {
    assert.equal(
        matchesCategory({ category_id: "category-1" }, "category-1"),
        true,
    );
    assert.equal(
        matchesCategory({ category_id: null }, "uncategorized"),
        true,
    );
    assert.equal(matchesCategory({ category_id: null }, "category-1"), false);
    assert.equal(matchesCategory({ category_id: "category-1" }, "all"), true);
});
