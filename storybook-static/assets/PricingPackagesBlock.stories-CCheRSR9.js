import{j as i}from"./iframe-hncPAmM6.js";import{P as o}from"./index-CrTsQPv1.js";import{k as e}from"./localLabData-BcZVdrIL.js";import{b as c}from"./blockArgTypes-D6A-V3JE.js";import"./preload-helper-PPVm8Dsz.js";import"./styleOptions-Bz1aaV6R.js";import"./index-Dzdt7HDB.js";const k={title:"Blocks/Pricing Packages",tags:["autodocs"],args:{heading:e.heading,subheading:e.subheading,packages:e.packages,section_theme:e.section_theme,top_spacing:e.top_spacing,bottom_spacing:e.bottom_spacing},argTypes:{heading:{control:"text",description:"Section heading"},subheading:{control:"text",description:"Subheading text"},packages:{control:"object",description:"Repeater: array of { name, price_label?, description?, inclusions? (HTML), is_featured?, cta_text?, cta_url? }"},...c},render:t=>i.jsx(o,{block:{acf_fc_layout:"pricing_packages",...t}})},a={},r={args:{section_theme:"dark"}},s={args:{packages:[{name:"Mini",price_label:"$1,200",description:"Elopements and micro-weddings.",inclusions:"<ul><li>3 hours</li><li>Digital gallery</li></ul>",cta_text:"Book Mini",cta_url:"/contact"},...e.packages]}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:"{}",...a.parameters?.docs?.source},description:{story:"Default: two packages, Signature featured.",...a.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    section_theme: 'dark'
  }
}`,...r.parameters?.docs?.source},description:{story:"Dark theme variant.",...r.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    packages: [{
      name: 'Mini',
      price_label: '$1,200',
      description: 'Elopements and micro-weddings.',
      inclusions: '<ul><li>3 hours</li><li>Digital gallery</li></ul>',
      cta_text: 'Book Mini',
      cta_url: '/contact'
    }, ...pricingBlock.packages]
  }
}`,...s.parameters?.docs?.source},description:{story:"Three packages — adds a budget tier.",...s.parameters?.docs?.description}}};const _=["Default","DarkTheme","ThreePackages"];export{r as DarkTheme,a as Default,s as ThreePackages,_ as __namedExportsOrder,k as default};
