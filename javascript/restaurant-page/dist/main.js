/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/css-loader/dist/cjs.js!./src/style.css"
/*!*************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/style.css ***!
  \*************************************************************/
(module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/noSourceMaps.js */ \"./node_modules/css-loader/dist/runtime/noSourceMaps.js\");\n/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ \"./node_modules/css-loader/dist/runtime/api.js\");\n/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);\n// Imports\n\n\nvar ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));\n// Module\n___CSS_LOADER_EXPORT___.push([module.id, `* {\n    margin: 0;\n    box-sizing: border-box;\n}\n\n:root {\n    --rojo: #8B1A1A;\n    --carbon: #2C1A0E;\n    --crema: #FDF6EC;\n    --dorado: #C0873A;\n    --humo: #6B4226;\n}\n\nhtml {\n    font-size: 17px;\n    background-color: var(--crema);\n    color: var(--carbon);\n    font-family: Georgia, serif;\n    line-height: 1.5;\n}\n\nheader {\n    background-color: var(--carbon);\n    color: var(--crema);\n    padding: 1.5rem 2.5rem;\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    flex-wrap: wrap;\n    gap: 1.5rem;\n    border-bottom: 3px solid var(--dorado);\n}\n\n#brand h1 {\n    font-size: 1.9rem;\n    color: var(--dorado);\n    letter-spacing: 2px;\n    font-weight: bold;\n}\n\n#brand p {\n    font-size: 0.85rem;\n    color: #c9b99a;\n    margin-top: 0.25rem;\n    max-width: 500px;\n}\n\nnav {\n    display: flex;\n    gap: 0.75rem;\n}\n\nnav button {\n    background: transparent;\n    border: 2px solid var(--dorado);\n    color: var(--dorado);\n    padding: 0.5rem 1.3rem;\n    font-size: 0.95rem;\n    cursor: pointer;\n    border-radius: 4px;\n    font-family: Georgia, serif;\n    font-weight: 500;\n    transition: background 0.2s, color 0.2s, transform 0.1s;\n}\n\nnav button:hover,\nnav button.active {\n    background: var(--dorado);\n    color: var(--carbon);\n    font-weight: bold;\n}\n\nmain {\n    max-width: 1040px;\n    margin: 2.5rem auto;\n    padding: 0 1.5rem;\n}\n\nsection h2 {\n    font-size: 1.7rem;\n    color: var(--rojo);\n    border-bottom: 2px solid var(--dorado);\n    padding-bottom: 0.5rem;\n    margin-bottom: 1.5rem;\n    letter-spacing: 0.5px;\n}\n\n/* --- HOME SECTION --- */\n.hero-container {\n    display: grid;\n    grid-template-columns: 1fr 1fr;\n    gap: 2.5rem;\n    align-items: center;\n}\n\n/* .hero-badge {\n    display: inline-block;\n    font-size: 0.75rem;\n    text-transform: uppercase;\n    letter-spacing: 1.5px;\n    background-color: var(--carbon);\n    color: var(--dorado);\n    padding: 0.3rem 0.8rem;\n    border-radius: 3px;\n    margin-bottom: 0.8rem;\n    font-weight: bold;\n} */\n\n.hero-text h2 {\n    border-bottom: none;\n    padding-bottom: 0;\n    margin-bottom: 0.8rem;\n    font-size: 1.8rem;\n    line-height: 1.25;\n}\n\n.hero-text p {\n    margin-bottom: 1.2rem;\n    line-height: 1.6;\n    color: var(--carbon);\n}\n\n.hero-text h3 {\n    font-size: 1.1rem;\n    color: var(--humo);\n    margin-bottom: 0.6rem;\n    margin-top: 1rem;\n}\n\n.hero-tags {\n    list-style: none;\n    display: flex;\n    flex-wrap: wrap;\n    gap: 0.5rem;\n    padding: 0;\n}\n\n.hero-tags li {\n    background: var(--rojo);\n    color: var(--crema);\n    padding: 0.4rem 0.9rem;\n    border-radius: 18px;\n    font-size: 0.85rem;\n    font-weight: 500;\n}\n\n.hero-image-wrapper {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n}\n\n.hero-img {\n    width: 100%;\n    max-height: 380px;\n    object-fit: cover;\n    border-radius: 6px;\n    border: 3px solid var(--dorado);\n    box-shadow: 0 8px 20px rgba(44, 26, 14, 0.25);\n}\n\n/* .image-caption {\n    font-size: 0.8rem;\n    color: var(--humo);\n    font-style: italic;\n    margin-top: 0.6rem;\n    text-align: center;\n} */\n\n/* --- MENU SECTION --- */\n.menu-category {\n    margin-bottom: 2rem;\n}\n\n.category-title {\n    font-size: 1.25rem;\n    color: var(--humo);\n    margin-bottom: 1rem;\n    padding-bottom: 0.3rem;\n    border-bottom: 1px dashed var(--dorado);\n}\n\n.dishes-grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));\n    gap: 1rem;\n}\n\n.dish-card {\n    background: rgba(255, 255, 255, 0.65);\n    border: 1px solid rgba(192, 135, 58, 0.35);\n    border-left: 4px solid var(--rojo);\n    padding: 0.9rem 1.1rem;\n    border-radius: 4px;\n    transition: transform 0.15s, box-shadow 0.15s;\n}\n\n.dish-card:hover {\n    transform: translateY(-2px);\n    box-shadow: 0 4px 12px rgba(44, 26, 14, 0.1);\n}\n\n.dish-header {\n    display: flex;\n    justify-content: space-between;\n    align-items: baseline;\n    gap: 1rem;\n}\n\n.dish-name {\n    font-weight: bold;\n    color: var(--carbon);\n    font-size: 1.05rem;\n}\n\n.dish-price {\n    color: var(--rojo);\n    font-weight: bold;\n    font-size: 1.05rem;\n    white-space: nowrap;\n}\n\n.dish-desc {\n    font-size: 0.85rem;\n    color: #554;\n    margin-top: 0.35rem;\n    line-height: 1.4;\n}\n\n/* --- CONTACT & RESERVATION SECTION --- */\n.contact-container {\n    display: grid;\n    grid-template-columns: 1fr 1fr;\n    gap: 2rem;\n}\n\n.contact-info h3,\n.reservation-box h3 {\n    font-size: 1.2rem;\n    color: var(--humo);\n    margin-bottom: 1rem;\n    border-bottom: 1px solid rgba(192, 135, 58, 0.4);\n    padding-bottom: 0.4rem;\n}\n\n.contact-info dl {\n    display: grid;\n    grid-template-columns: 150px 1fr;\n    gap: 0.8rem 1rem;\n    font-size: 0.95rem;\n}\n\n.contact-info dt {\n    font-weight: bold;\n    color: var(--humo);\n}\n\n.contact-info dd {\n    color: var(--carbon);\n}\n\n.reservation-box {\n    background: rgba(44, 26, 14, 0.04);\n    border: 1px solid rgba(192, 135, 58, 0.4);\n    border-radius: 6px;\n    padding: 1.4rem;\n}\n\n.reservation-form .form-group {\n    margin-bottom: 0.9rem;\n}\n\n.reservation-form label {\n    display: block;\n    font-size: 0.85rem;\n    font-weight: bold;\n    color: var(--humo);\n    margin-bottom: 0.3rem;\n}\n\n.reservation-form input,\n.reservation-form select {\n    width: 100%;\n    padding: 0.6rem 0.75rem;\n    font-size: 0.9rem;\n    font-family: inherit;\n    border: 1px solid #c4b5a2;\n    border-radius: 4px;\n    background-color: #ffffff;\n    color: var(--carbon);\n    transition: border-color 0.2s, box-shadow 0.2s;\n}\n\n.reservation-form input:focus,\n.reservation-form select:focus {\n    outline: none;\n    border-color: var(--dorado);\n    box-shadow: 0 0 0 2px rgba(192, 135, 58, 0.25);\n}\n\n/* Tooltip container */\n.tooltip-container {\n    position: relative;\n    display: block;\n    width: 100%;\n    margin-top: 0.6rem;\n    cursor: not-allowed;\n}\n\n.btn-reservation-disabled {\n    width: 100%;\n    background-color: #8c7f76;\n    color: #ede5dc;\n    border: 1px solid #756a62;\n    padding: 0.75rem 1rem;\n    font-size: 0.95rem;\n    font-family: Georgia, serif;\n    font-weight: bold;\n    border-radius: 4px;\n    cursor: not-allowed;\n    opacity: 0.85;\n    pointer-events: none;\n}\n\n.tooltip-container .tooltip-text {\n    visibility: hidden;\n    opacity: 0;\n    width: 100%;\n    max-width: 320px;\n    background-color: var(--carbon);\n    color: var(--crema);\n    text-align: center;\n    border: 1px solid var(--dorado);\n    border-radius: 4px;\n    padding: 0.55rem 0.85rem;\n    position: absolute;\n    z-index: 20;\n    bottom: calc(100% + 8px);\n    left: 50%;\n    transform: translateX(-50%);\n    font-size: 0.82rem;\n    line-height: 1.35;\n    box-shadow: 0 4px 14px rgba(44, 26, 14, 0.35);\n    transition: opacity 0.2s ease, visibility 0.2s ease;\n    pointer-events: none;\n}\n\n.tooltip-container .tooltip-text::after {\n    content: \"\";\n    position: absolute;\n    top: 100%;\n    left: 50%;\n    margin-left: -6px;\n    border-width: 6px;\n    border-style: solid;\n    border-color: var(--carbon) transparent transparent transparent;\n}\n\n.tooltip-container:hover .tooltip-text {\n    visibility: visible;\n    opacity: 1;\n}\n\n/* --- RESPONSIVE ADJUSTMENTS --- */\n@media (max-width: 768px) {\n    header {\n        flex-direction: column;\n        align-items: flex-start;\n    }\n\n    .hero-container {\n        grid-template-columns: 1fr;\n    }\n\n    .contact-container {\n        grid-template-columns: 1fr;\n    }\n\n    .dishes-grid {\n        grid-template-columns: 1fr;\n    }\n\n    .contact-info dl {\n        grid-template-columns: 1fr;\n        gap: 0.3rem;\n    }\n\n    .contact-info dd {\n        margin-bottom: 0.7rem;\n    }\n}`, \"\"]);\n// Exports\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);\n\n\n//# sourceURL=webpack://restaurant-page/./src/style.css?./node_modules/css-loader/dist/cjs.js\n}");

/***/ },

/***/ "./node_modules/css-loader/dist/runtime/api.js"
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
(module) {

eval("{\n\n/*\n  MIT License http://www.opensource.org/licenses/mit-license.php\n  Author Tobias Koppers @sokra\n*/\nmodule.exports = function (cssWithMappingToString) {\n  var list = [];\n\n  // return the list of modules as css string\n  list.toString = function toString() {\n    return this.map(function (item) {\n      var content = \"\";\n      var needLayer = typeof item[5] !== \"undefined\";\n      if (item[4]) {\n        content += \"@supports (\".concat(item[4], \") {\");\n      }\n      if (item[2]) {\n        content += \"@media \".concat(item[2], \" {\");\n      }\n      if (needLayer) {\n        content += \"@layer\".concat(item[5].length > 0 ? \" \".concat(item[5]) : \"\", \" {\");\n      }\n      content += cssWithMappingToString(item);\n      if (needLayer) {\n        content += \"}\";\n      }\n      if (item[2]) {\n        content += \"}\";\n      }\n      if (item[4]) {\n        content += \"}\";\n      }\n      return content;\n    }).join(\"\");\n  };\n\n  // import a list of modules into the list\n  list.i = function i(modules, media, dedupe, supports, layer) {\n    if (typeof modules === \"string\") {\n      modules = [[null, modules, undefined]];\n    }\n    var alreadyImportedModules = {};\n    if (dedupe) {\n      for (var k = 0; k < this.length; k++) {\n        var id = this[k][0];\n        if (id != null) {\n          alreadyImportedModules[id] = true;\n        }\n      }\n    }\n    for (var _k = 0; _k < modules.length; _k++) {\n      var item = [].concat(modules[_k]);\n      if (dedupe && alreadyImportedModules[item[0]]) {\n        continue;\n      }\n      if (typeof layer !== \"undefined\") {\n        if (typeof item[5] === \"undefined\") {\n          item[5] = layer;\n        } else {\n          item[1] = \"@layer\".concat(item[5].length > 0 ? \" \".concat(item[5]) : \"\", \" {\").concat(item[1], \"}\");\n          item[5] = layer;\n        }\n      }\n      if (media) {\n        if (!item[2]) {\n          item[2] = media;\n        } else {\n          item[1] = \"@media \".concat(item[2], \" {\").concat(item[1], \"}\");\n          item[2] = media;\n        }\n      }\n      if (supports) {\n        if (!item[4]) {\n          item[4] = \"\".concat(supports);\n        } else {\n          item[1] = \"@supports (\".concat(item[4], \") {\").concat(item[1], \"}\");\n          item[4] = supports;\n        }\n      }\n      list.push(item);\n    }\n  };\n  return list;\n};\n\n//# sourceURL=webpack://restaurant-page/./node_modules/css-loader/dist/runtime/api.js?\n}");

/***/ },

/***/ "./node_modules/css-loader/dist/runtime/noSourceMaps.js"
/*!**************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/noSourceMaps.js ***!
  \**************************************************************/
(module) {

eval("{\n\nmodule.exports = function (i) {\n  return i[1];\n};\n\n//# sourceURL=webpack://restaurant-page/./node_modules/css-loader/dist/runtime/noSourceMaps.js?\n}");

/***/ },

/***/ "./src/style.css"
/*!***********************!*\
  !*** ./src/style.css ***!
  \***********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ \"./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js\");\n/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleDomAPI.js */ \"./node_modules/style-loader/dist/runtime/styleDomAPI.js\");\n/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertBySelector.js */ \"./node_modules/style-loader/dist/runtime/insertBySelector.js\");\n/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ \"./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js\");\n/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertStyleElement.js */ \"./node_modules/style-loader/dist/runtime/insertStyleElement.js\");\n/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleTagTransform.js */ \"./node_modules/style-loader/dist/runtime/styleTagTransform.js\");\n/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);\n/* harmony import */ var _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js!./style.css */ \"./node_modules/css-loader/dist/cjs.js!./src/style.css\");\n\n      \n      \n      \n      \n      \n      \n      \n      \n      \n\nvar options = {};\n\noptions.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());\noptions.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());\noptions.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, \"head\");\noptions.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());\noptions.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());\n\nvar update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__[\"default\"], options);\n\n\n\n\n       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__[\"default\"] && _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__[\"default\"].locals ? _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__[\"default\"].locals : undefined);\n\n\n//# sourceURL=webpack://restaurant-page/./src/style.css?\n}");

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js"
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
(module) {

eval("{\n\nvar stylesInDOM = [];\nfunction getIndexByIdentifier(identifier) {\n  var result = -1;\n  for (var i = 0; i < stylesInDOM.length; i++) {\n    if (stylesInDOM[i].identifier === identifier) {\n      result = i;\n      break;\n    }\n  }\n  return result;\n}\nfunction modulesToDom(list, options) {\n  var idCountMap = {};\n  var identifiers = [];\n  for (var i = 0; i < list.length; i++) {\n    var item = list[i];\n    var id = options.base ? item[0] + options.base : item[0];\n    var count = idCountMap[id] || 0;\n    var identifier = \"\".concat(id, \" \").concat(count);\n    idCountMap[id] = count + 1;\n    var indexByIdentifier = getIndexByIdentifier(identifier);\n    var obj = {\n      css: item[1],\n      media: item[2],\n      sourceMap: item[3],\n      supports: item[4],\n      layer: item[5]\n    };\n    if (indexByIdentifier !== -1) {\n      stylesInDOM[indexByIdentifier].references++;\n      stylesInDOM[indexByIdentifier].updater(obj);\n    } else {\n      var updater = addElementStyle(obj, options);\n      options.byIndex = i;\n      stylesInDOM.splice(i, 0, {\n        identifier: identifier,\n        updater: updater,\n        references: 1\n      });\n    }\n    identifiers.push(identifier);\n  }\n  return identifiers;\n}\nfunction addElementStyle(obj, options) {\n  var api = options.domAPI(options);\n  api.update(obj);\n  var updater = function updater(newObj) {\n    if (newObj) {\n      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {\n        return;\n      }\n      api.update(obj = newObj);\n    } else {\n      api.remove();\n    }\n  };\n  return updater;\n}\nmodule.exports = function (list, options) {\n  options = options || {};\n  list = list || [];\n  var lastIdentifiers = modulesToDom(list, options);\n  return function update(newList) {\n    newList = newList || [];\n    for (var i = 0; i < lastIdentifiers.length; i++) {\n      var identifier = lastIdentifiers[i];\n      var index = getIndexByIdentifier(identifier);\n      stylesInDOM[index].references--;\n    }\n    var newLastIdentifiers = modulesToDom(newList, options);\n    for (var _i = 0; _i < lastIdentifiers.length; _i++) {\n      var _identifier = lastIdentifiers[_i];\n      var _index = getIndexByIdentifier(_identifier);\n      if (stylesInDOM[_index].references === 0) {\n        stylesInDOM[_index].updater();\n        stylesInDOM.splice(_index, 1);\n      }\n    }\n    lastIdentifiers = newLastIdentifiers;\n  };\n};\n\n//# sourceURL=webpack://restaurant-page/./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js?\n}");

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/insertBySelector.js"
/*!********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertBySelector.js ***!
  \********************************************************************/
(module) {

eval("{\n\nvar memo = {};\n\n/* istanbul ignore next  */\nfunction getTarget(target) {\n  if (typeof memo[target] === \"undefined\") {\n    var styleTarget = document.querySelector(target);\n\n    // Special case to return head of iframe instead of iframe itself\n    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {\n      try {\n        // This will throw an exception if access to iframe is blocked\n        // due to cross-origin restrictions\n        styleTarget = styleTarget.contentDocument.head;\n      } catch (e) {\n        // istanbul ignore next\n        styleTarget = null;\n      }\n    }\n    memo[target] = styleTarget;\n  }\n  return memo[target];\n}\n\n/* istanbul ignore next  */\nfunction insertBySelector(insert, style) {\n  var target = getTarget(insert);\n  if (!target) {\n    throw new Error(\"Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.\");\n  }\n  target.appendChild(style);\n}\nmodule.exports = insertBySelector;\n\n//# sourceURL=webpack://restaurant-page/./node_modules/style-loader/dist/runtime/insertBySelector.js?\n}");

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/insertStyleElement.js"
/*!**********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertStyleElement.js ***!
  \**********************************************************************/
(module) {

eval("{\n\n/* istanbul ignore next  */\nfunction insertStyleElement(options) {\n  var element = document.createElement(\"style\");\n  options.setAttributes(element, options.attributes);\n  options.insert(element, options.options);\n  return element;\n}\nmodule.exports = insertStyleElement;\n\n//# sourceURL=webpack://restaurant-page/./node_modules/style-loader/dist/runtime/insertStyleElement.js?\n}");

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js"
/*!**********************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js ***!
  \**********************************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

eval("{\n\n/* istanbul ignore next  */\nfunction setAttributesWithoutAttributes(styleElement) {\n  var nonce =  true ? __webpack_require__.nc : 0;\n  if (nonce) {\n    styleElement.setAttribute(\"nonce\", nonce);\n  }\n}\nmodule.exports = setAttributesWithoutAttributes;\n\n//# sourceURL=webpack://restaurant-page/./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js?\n}");

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/styleDomAPI.js"
/*!***************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleDomAPI.js ***!
  \***************************************************************/
(module) {

eval("{\n\n/* istanbul ignore next  */\nfunction apply(styleElement, options, obj) {\n  var css = \"\";\n  if (obj.supports) {\n    css += \"@supports (\".concat(obj.supports, \") {\");\n  }\n  if (obj.media) {\n    css += \"@media \".concat(obj.media, \" {\");\n  }\n  var needLayer = typeof obj.layer !== \"undefined\";\n  if (needLayer) {\n    css += \"@layer\".concat(obj.layer.length > 0 ? \" \".concat(obj.layer) : \"\", \" {\");\n  }\n  css += obj.css;\n  if (needLayer) {\n    css += \"}\";\n  }\n  if (obj.media) {\n    css += \"}\";\n  }\n  if (obj.supports) {\n    css += \"}\";\n  }\n  var sourceMap = obj.sourceMap;\n  if (sourceMap && typeof btoa !== \"undefined\") {\n    css += \"\\n/*# sourceMappingURL=data:application/json;base64,\".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), \" */\");\n  }\n\n  // For old IE\n  /* istanbul ignore if  */\n  options.styleTagTransform(css, styleElement, options.options);\n}\nfunction removeStyleElement(styleElement) {\n  // istanbul ignore if\n  if (styleElement.parentNode === null) {\n    return false;\n  }\n  styleElement.parentNode.removeChild(styleElement);\n}\n\n/* istanbul ignore next  */\nfunction domAPI(options) {\n  if (typeof document === \"undefined\") {\n    return {\n      update: function update() {},\n      remove: function remove() {}\n    };\n  }\n  var styleElement = options.insertStyleElement(options);\n  return {\n    update: function update(obj) {\n      apply(styleElement, options, obj);\n    },\n    remove: function remove() {\n      removeStyleElement(styleElement);\n    }\n  };\n}\nmodule.exports = domAPI;\n\n//# sourceURL=webpack://restaurant-page/./node_modules/style-loader/dist/runtime/styleDomAPI.js?\n}");

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/styleTagTransform.js"
/*!*********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleTagTransform.js ***!
  \*********************************************************************/
(module) {

eval("{\n\n/* istanbul ignore next  */\nfunction styleTagTransform(css, styleElement) {\n  if (styleElement.styleSheet) {\n    styleElement.styleSheet.cssText = css;\n  } else {\n    while (styleElement.firstChild) {\n      styleElement.removeChild(styleElement.firstChild);\n    }\n    styleElement.appendChild(document.createTextNode(css));\n  }\n}\nmodule.exports = styleTagTransform;\n\n//# sourceURL=webpack://restaurant-page/./node_modules/style-loader/dist/runtime/styleTagTransform.js?\n}");

/***/ },

/***/ "./src/assets/parrillada.jpeg"
/*!************************************!*\
  !*** ./src/assets/parrillada.jpeg ***!
  \************************************/
(module, __unused_webpack_exports, __webpack_require__) {

eval("{module.exports = __webpack_require__.p + \"abd5bc6b9e88420e8661.jpeg\";\n\n//# sourceURL=webpack://restaurant-page/./src/assets/parrillada.jpeg?\n}");

/***/ },

/***/ "./src/index.js"
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _start_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./start.js */ \"./src/start.js\");\n/* harmony import */ var _modules_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./modules.js */ \"./src/modules.js\");\n/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./style.css */ \"./src/style.css\");\n\n\n\n\nconst [h1, p] = (0,_start_js__WEBPACK_IMPORTED_MODULE_0__.starting)();\nconst brand = document.getElementById(\"brand\");\nbrand.appendChild(h1);\nbrand.appendChild(p);\n\nconst content = document.getElementById(\"content\");\n\nfunction renderSection(sectionFn) {\n    content.innerHTML = \"\";\n    content.appendChild(sectionFn());\n}\n\nrenderSection(_modules_js__WEBPACK_IMPORTED_MODULE_1__.home);\n\nconst sections = [_modules_js__WEBPACK_IMPORTED_MODULE_1__.home, _modules_js__WEBPACK_IMPORTED_MODULE_1__.menu, _modules_js__WEBPACK_IMPORTED_MODULE_1__.contact];\nconst buttons = document.querySelectorAll(\"nav button\");\n\nbuttons[0].classList.add(\"active\");\n\nbuttons.forEach((btn, i) => {\n    btn.addEventListener(\"click\", () => {\n        buttons.forEach(b => b.classList.remove(\"active\"));\n        btn.classList.add(\"active\");\n        renderSection(sections[i]);\n    });\n});\n\n//# sourceURL=webpack://restaurant-page/./src/index.js?\n}");

/***/ },

/***/ "./src/modules.js"
/*!************************!*\
  !*** ./src/modules.js ***!
  \************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   contact: () => (/* binding */ contact),\n/* harmony export */   home: () => (/* binding */ home),\n/* harmony export */   menu: () => (/* binding */ menu)\n/* harmony export */ });\n/* harmony import */ var _assets_parrillada_jpeg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./assets/parrillada.jpeg */ \"./src/assets/parrillada.jpeg\");\n\n\nfunction home() {\n    const section = document.createElement(\"section\");\n    section.classList.add(\"home\");\n\n    const heroContainer = document.createElement(\"div\");\n    heroContainer.classList.add(\"hero-container\");\n\n    const textCol = document.createElement(\"div\");\n    textCol.classList.add(\"hero-text\");\n\n    const welcome = document.createElement(\"h2\");\n    welcome.textContent = \"El verdadero sabor del asado argentino\";\n\n    const subtext = document.createElement(\"p\");\n    subtext.textContent = \"Seleccionamos los mejores cortes de novillo de pastura y los asamos pacientemente a las brasas de leña de quebracho, honrando la costumbre gastronómica de Santa Fe.\";\n\n    const highlightsTitle = document.createElement(\"h3\");\n    highlightsTitle.textContent = \"Especialidades de la Casa\";\n\n    const highlights = document.createElement(\"ul\");\n    highlights.classList.add(\"hero-tags\");\n    const items = [\n        \"Asado de Tira\",\n        \"Bife de Chorizo\",\n        \"Mollejas al Limón\",\n        \"Vacío al Asador\",\n        \"Provoleta Especial\",\n        \"Entraña Fina\"\n    ];\n    items.forEach(item => {\n        const li = document.createElement(\"li\");\n        li.textContent = item;\n        highlights.appendChild(li);\n    });\n\n    textCol.appendChild(welcome);\n    textCol.appendChild(subtext);\n    textCol.appendChild(highlightsTitle);\n    textCol.appendChild(highlights);\n\n    const imageCol = document.createElement(\"div\");\n    imageCol.classList.add(\"hero-image-wrapper\");\n\n    const img = document.createElement(\"img\");\n    img.src = _assets_parrillada_jpeg__WEBPACK_IMPORTED_MODULE_0__;\n    img.alt = \"Parrillada tradicional argentina servida con cortes seleccionados\";\n    img.classList.add(\"hero-img\");\n\n    imageCol.appendChild(img);\n\n    heroContainer.appendChild(textCol);\n    heroContainer.appendChild(imageCol);\n    section.appendChild(heroContainer);\n\n    return section;\n}\n\nfunction menu() {\n    const section = document.createElement(\"section\");\n    section.classList.add(\"menu\");\n\n    const title = document.createElement(\"h2\");\n    title.textContent = \"Nuestra Carta Criolla\";\n    section.appendChild(title);\n\n    const menuCategories = [\n        {\n            category: \"Entradas y Achuras\",\n            items: [\n                { name: \"Provoleta a la Parrilla\", price: \"$4.800\", desc: \"Queso provolone fundido con orégano fresco, ají molido y aceite de oliva virgen extra\" },\n                { name: \"Mollejas al Limón\", price: \"$6.900\", desc: \"Doradas y crocantes por fuera, tiernas por dentro, terminadas con jugo de limón natural\" },\n                { name: \"Chorizo y Morcilla Criolla\", price: \"$3.900\", desc: \"Dúo artesanal de puro cerdo y morcilla especiada con cebolla de verdeo\" },\n                { name: \"Chinchulines Crocantes\", price: \"$5.200\", desc: \"Trenza de chinchulín dorada a las brasas viva con sal gruesa y limón\" },\n                { name: \"Empanada Criolla de Carne\", price: \"$1.800\", desc: \"Carne cortada a cuchillo, horneada en masa casera tradicional\" }\n            ]\n        },\n        {\n            category: \"Cortes a las Brasas\",\n            items: [\n                { name: \"Asado de Tira\", price: \"$9.500\", desc: \"Tiras anchas de costillar de novillo asadas a fuego moderado de quebracho\" },\n                { name: \"Bife de Chorizo (400g)\", price: \"$10.800\", desc: \"Corte noble, jugoso, tierno y con el borde de grasa crocante ideal\" },\n                { name: \"Ojo de Bife Premium\", price: \"$11.200\", desc: \"Centro de bife ancho con un marmoleado óptimo para máxima terneza\" },\n                { name: \"Vacío Asado\", price: \"$8.900\", desc: \"Corte tierno con membrana crocante, servido con chimichurri casero\" },\n                { name: \"Entraña Fina\", price: \"$9.800\", desc: \"Corte magro y de intenso sabor, cocinado a punto exacto\" },\n                { name: \"Matambre a la Pizza\", price: \"$8.600\", desc: \"Matambre tiernizado cubierto con salsa de tomate de la casa, mozzarella gratinada y orégano\" }\n            ]\n        },\n        {\n            category: \"Guarniciones y Ensaladas\",\n            items: [\n                { name: \"Papas Fritas a la Provenzal\", price: \"$3.500\", desc: \"Papas bastón cortadas a mano, salteadas con ajo picado, perejil y oliva\" },\n                { name: \"Ensalada Mixta Tradicional\", price: \"$2.800\", desc: \"Hojas frescas de lechuga criolla, rodajas de tomate y cebolla morada\" },\n                { name: \"Ensalada de Rúcula y Parmesano\", price: \"$3.600\", desc: \"Rúcula fresca de estación, láminas de queso parmesano y reducción de aceto\" },\n                { name: \"Puré de Papas Casero\", price: \"$3.000\", desc: \"Cremoso puré de papas con manteca de campo y nuez moscada\" }\n            ]\n        },\n        {\n            category: \"Postres Clásicos\",\n            items: [\n                { name: \"Flan Casero Mixto\", price: \"$3.200\", desc: \"El clásico flan con dulce de leche colonial y crema batida fresca\" },\n                { name: \"Panqueque con Dulce de Leche\", price: \"$3.500\", desc: \"Tibio, relleno abundante y caramelizado con azúcar crocante\" },\n                { name: \"Don Pedro Tradicional\", price: \"$4.200\", desc: \"Helado de crema americana con nueces tostadas y licor de whisky\" }\n            ]\n        }\n    ];\n\n    menuCategories.forEach(cat => {\n        const catContainer = document.createElement(\"div\");\n        catContainer.classList.add(\"menu-category\");\n\n        const catTitle = document.createElement(\"h3\");\n        catTitle.classList.add(\"category-title\");\n        catTitle.textContent = cat.category;\n        catContainer.appendChild(catTitle);\n\n        const list = document.createElement(\"div\");\n        list.classList.add(\"dishes-grid\");\n\n        cat.items.forEach(dish => {\n            const card = document.createElement(\"div\");\n            card.classList.add(\"dish-card\");\n\n            const namePrice = document.createElement(\"div\");\n            namePrice.classList.add(\"dish-header\");\n\n            const nameEl = document.createElement(\"span\");\n            nameEl.classList.add(\"dish-name\");\n            nameEl.textContent = dish.name;\n\n            const priceEl = document.createElement(\"span\");\n            priceEl.classList.add(\"dish-price\");\n            priceEl.textContent = dish.price;\n\n            namePrice.appendChild(nameEl);\n            namePrice.appendChild(priceEl);\n\n            const descEl = document.createElement(\"p\");\n            descEl.classList.add(\"dish-desc\");\n            descEl.textContent = dish.desc;\n\n            card.appendChild(namePrice);\n            card.appendChild(descEl);\n            list.appendChild(card);\n        });\n\n        catContainer.appendChild(list);\n        section.appendChild(catContainer);\n    });\n\n    return section;\n}\n\nfunction contact() {\n    const section = document.createElement(\"section\");\n    section.classList.add(\"contact\");\n\n    const title = document.createElement(\"h2\");\n    title.textContent = \"Contacto y Reservas\";\n    section.appendChild(title);\n\n    const contactContainer = document.createElement(\"div\");\n    contactContainer.classList.add(\"contact-container\");\n\n    // Columna de información\n    const infoCol = document.createElement(\"div\");\n    infoCol.classList.add(\"contact-info\");\n\n    const infoHeading = document.createElement(\"h3\");\n    infoHeading.textContent = \"Información del Restaurante\";\n    infoCol.appendChild(infoHeading);\n\n    const infoList = [\n        { label: \"Dirección\", value: \"Av. General Paz 1234, Santa Fe, Argentina\" },\n        { label: \"Teléfono\", value: \"+54 342 456-7890\" },\n        { label: \"WhatsApp Reservas\", value: \"+54 9 342 512-3456\" },\n        { label: \"Correo Electrónico\", value: \"reservas@luigisparrilla.com.ar\" },\n        { label: \"Almuerzo\", value: \"Martes a Domingo: 11:30 a 15:30 hs\" },\n        { label: \"Cena\", value: \"Martes a Sábado: 20:00 a 00:30 hs\" },\n        { label: \"Día de Descanso\", value: \"Lunes todo el día\" }\n    ];\n\n    const dl = document.createElement(\"dl\");\n    infoList.forEach(item => {\n        const dt = document.createElement(\"dt\");\n        dt.textContent = item.label;\n        const dd = document.createElement(\"dd\");\n        dd.textContent = item.value;\n        dl.appendChild(dt);\n        dl.appendChild(dd);\n    });\n    infoCol.appendChild(dl);\n\n    // Columna de formulario de reserva\n    const formCol = document.createElement(\"div\");\n    formCol.classList.add(\"reservation-box\");\n\n    const formHeading = document.createElement(\"h3\");\n    formHeading.textContent = \"Solicitar Mesa\";\n    formCol.appendChild(formHeading);\n\n    const form = document.createElement(\"form\");\n    form.classList.add(\"reservation-form\");\n    form.onsubmit = (e) => e.preventDefault();\n\n    const nameGroup = document.createElement(\"div\");\n    nameGroup.classList.add(\"form-group\");\n    const nameLabel = document.createElement(\"label\");\n    nameLabel.textContent = \"Nombre y Apellido\";\n    const nameInput = document.createElement(\"input\");\n    nameInput.type = \"text\";\n    nameInput.placeholder = \"Ej: Carlos Gómez\";\n    nameGroup.appendChild(nameLabel);\n    nameGroup.appendChild(nameInput);\n\n    const dateGroup = document.createElement(\"div\");\n    dateGroup.classList.add(\"form-group\");\n    const dateLabel = document.createElement(\"label\");\n    dateLabel.textContent = \"Fecha y Turno\";\n    const dateInput = document.createElement(\"input\");\n    dateInput.type = \"date\";\n    dateGroup.appendChild(dateLabel);\n    dateGroup.appendChild(dateInput);\n\n    const guestsGroup = document.createElement(\"div\");\n    guestsGroup.classList.add(\"form-group\");\n    const guestsLabel = document.createElement(\"label\");\n    guestsLabel.textContent = \"Cantidad de Comensales\";\n    const guestsSelect = document.createElement(\"select\");\n    [\"1 Persona\", \"2 Personas\", \"3 Personas\", \"4 Personas\", \"5 o más Personas\"].forEach((optText, index) => {\n        const option = document.createElement(\"option\");\n        option.value = String(index + 1);\n        option.textContent = optText;\n        if (index === 1) option.selected = true;\n        guestsSelect.appendChild(option);\n    });\n    guestsGroup.appendChild(guestsLabel);\n    guestsGroup.appendChild(guestsSelect);\n\n    const tooltipWrapper = document.createElement(\"div\");\n    tooltipWrapper.classList.add(\"tooltip-container\");\n\n    const submitBtn = document.createElement(\"button\");\n    submitBtn.type = \"button\";\n    submitBtn.disabled = true;\n    submitBtn.classList.add(\"btn-reservation-disabled\");\n    submitBtn.textContent = \"Solicitar Reserva\";\n    submitBtn.title = \"Reservas online momentáneamente suspendidas por alta demanda. Por favor comuníquese por teléfono.\";\n\n    const tooltipText = document.createElement(\"span\");\n    tooltipText.classList.add(\"tooltip-text\");\n    tooltipText.textContent = \"Reservas online momentáneamente suspendidas por alta demanda. Por favor comuníquese por teléfono.\";\n\n    tooltipWrapper.appendChild(submitBtn);\n    tooltipWrapper.appendChild(tooltipText);\n\n    form.appendChild(nameGroup);\n    form.appendChild(dateGroup);\n    form.appendChild(guestsGroup);\n    form.appendChild(tooltipWrapper);\n\n    formCol.appendChild(form);\n\n    contactContainer.appendChild(infoCol);\n    contactContainer.appendChild(formCol);\n    section.appendChild(contactContainer);\n\n    return section;\n}\n\n\n\n//# sourceURL=webpack://restaurant-page/./src/modules.js?\n}");

/***/ },

/***/ "./src/start.js"
/*!**********************!*\
  !*** ./src/start.js ***!
  \**********************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   starting: () => (/* binding */ starting)\n/* harmony export */ });\nfunction starting() {\n    const h1 = document.createElement(\"h1\");\n    h1.textContent = \"Luigi's Parrilla\";\n\n    const p = document.createElement(\"p\");\n    p.textContent = \"La tradición del asado argentino desde 1985. Cortes premium, brasas vivas y el sabor inigualable de nuestra tierra.\";\n\n    return [h1, p];\n}\n\n\n\n//# sourceURL=webpack://restaurant-page/./src/start.js?\n}");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ })()
;