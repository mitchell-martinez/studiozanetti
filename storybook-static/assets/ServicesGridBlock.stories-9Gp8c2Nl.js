import{j as a}from"./iframe-hncPAmM6.js";import{S as c}from"./index-BjICr8nU.js";import{s as e}from"./localLabData-BcZVdrIL.js";import{b as i}from"./blockArgTypes-D6A-V3JE.js";import"./preload-helper-PPVm8Dsz.js";import"./styleOptions-Bz1aaV6R.js";const g={title:"Blocks/Services Grid",tags:["autodocs"],args:{heading:e.heading,subheading:e.subheading,columns:e.columns,card_style:e.card_style,services:e.services,cta_text:e.cta_text,cta_url:e.cta_url,section_theme:e.section_theme,top_spacing:e.top_spacing,bottom_spacing:e.bottom_spacing},argTypes:{heading:{control:"text",description:"Section heading"},subheading:{control:"text",description:"Subheading below the main heading"},cta_text:{control:"text",description:"Call-to-action button label"},cta_url:{control:"text",description:"Call-to-action URL"},columns:{control:"inline-radio",options:[2,3,4],description:"Number of grid columns"},card_style:{control:"inline-radio",options:["elevated","outline","minimal"],description:"Visual card treatment"},services:{control:"object",description:"Repeater: array of { title, description, image? }"},...i},render:s=>a.jsx(c,{block:{acf_fc_layout:"services_grid",...s}})},o={},t={args:{columns:2,card_style:"minimal"}},r={args:{columns:4,card_style:"outline",section_theme:"dark"}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:"{}",...o.parameters?.docs?.source},description:{story:"Default: 3-column elevated cards on rose background.",...o.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    columns: 2,
    card_style: 'minimal'
  }
}`,...t.parameters?.docs?.source},description:{story:"Minimal card style, 2-column layout.",...t.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    columns: 4,
    card_style: 'outline',
    section_theme: 'dark'
  }
}`,...r.parameters?.docs?.source},description:{story:"4-column outline variant on dark theme.",...r.parameters?.docs?.description}}};const _=["Default","TwoColumnMinimal","FourColumnDark"];export{o as Default,r as FourColumnDark,t as TwoColumnMinimal,_ as __namedExportsOrder,g as default};
