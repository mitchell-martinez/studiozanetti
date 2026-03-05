import{j as n}from"./iframe-hncPAmM6.js";import{T as i}from"./index-c2sK3EDQ.js";import{m as t}from"./localLabData-BcZVdrIL.js";import{b as c}from"./blockArgTypes-D6A-V3JE.js";import"./preload-helper-PPVm8Dsz.js";import"./styleOptions-Bz1aaV6R.js";import"./index-Dzdt7HDB.js";const _={title:"Blocks/Text",tags:["autodocs"],args:{heading:t.heading,body:t.body,eyebrow:t.eyebrow,align:t.align,max_width:t.max_width,cta_text:t.cta_text,cta_url:t.cta_url,section_theme:t.section_theme,top_spacing:t.top_spacing,bottom_spacing:t.bottom_spacing},argTypes:{heading:{control:"text",description:"Section heading"},body:{control:"text",description:"Rich-text body content (HTML from WP WYSIWYG)"},eyebrow:{control:"text",description:"Small label above the heading"},cta_text:{control:"text",description:"Call-to-action button label"},cta_url:{control:"text",description:"Call-to-action URL"},align:{control:"inline-radio",options:["left","center"],description:"Text alignment"},max_width:{control:"inline-radio",options:["narrow","normal","wide"],description:"Maximum width of the text container"},...c},render:a=>n.jsx(i,{block:{acf_fc_layout:"text_block",...a}})},e={},o={args:{align:"center",section_theme:"dark"}},r={args:{max_width:"narrow",cta_text:"",cta_url:""}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source},description:{story:"Default text block with left-aligned body text.",...e.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    align: 'center',
    section_theme: 'dark'
  }
}`,...o.parameters?.docs?.source},description:{story:"Centred variant on dark background.",...o.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    max_width: 'narrow',
    cta_text: '',
    cta_url: ''
  }
}`,...r.parameters?.docs?.source},description:{story:"Narrow width, no CTA — simple content section.",...r.parameters?.docs?.description}}};const u=["Default","CenteredDark","NarrowNoCta"];export{o as CenteredDark,e as Default,r as NarrowNoCta,u as __namedExportsOrder,_ as default};
