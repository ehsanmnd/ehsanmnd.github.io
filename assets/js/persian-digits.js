/**
 * Persian Digits
 * Converts Western digits (0-9) to Persian digits (۰-۹) inside RTL elements.
 *
 * Why JS and not the font? The IRANSans font ships Persian digit glyphs, but the
 * browser — not the font — decides which glyph to render, and browsers render
 * ASCII digits as Latin even inside RTL text. Converting the actual characters
 * (U+06F0–U+06F9) is the reliable way to get Persian numerals.
 *
 * Scope: only elements with dir="rtl" (or inside an RTL ancestor). English
 * content is left untouched.
 */
(function () {
  'use strict';

  var persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  function toPersianDigits(text) {
    return text.replace(/[0-9]/g, function (d) {
      return persianDigits[d.charCodeAt(0) - 48];
    });
  }

  function isRtl(el) {
    // Walk up the tree; an explicit dir="rtl" (or rtl-content class) marks scope.
    var node = el;
    while (node && node !== document.documentElement) {
      if (node.dir === 'rtl' || (node.classList && node.classList.contains('rtl-content'))) {
        return true;
      }
      // Stop once we hit an explicit dir="ltr" boundary.
      if (node.dir === 'ltr') {
        return false;
      }
      node = node.parentNode;
    }
    return document.documentElement.dir === 'rtl';
  }

  function convertTextNodes(root) {
    var walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          // Skip <script>, <style>, <code>, <pre> to preserve code blocks.
          var parent = node.parentNode;
          if (!parent) return NodeFilter.FILTER_REJECT;
          var tag = parent.nodeName.toLowerCase();
          if (tag === 'script' || tag === 'style' || tag === 'code' || tag === 'pre') {
            return NodeFilter.FILTER_REJECT;
          }
          return /[0-9]/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    var nodes = [];
    var current;
    while ((current = walker.nextNode())) {
      if (isRtl(current)) {
        nodes.push(current);
      }
    }

    nodes.forEach(function (node) {
      node.nodeValue = toPersianDigits(node.nodeValue);
    });
  }

  function init() {
    convertTextNodes(document.body);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
