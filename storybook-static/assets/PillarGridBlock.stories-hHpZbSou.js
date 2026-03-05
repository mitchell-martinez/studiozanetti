import{j as t}from"./iframe-hncPAmM6.js";import{P as i}from"./index-DMOlQRmP.js";import{p as r}from"./localLabData-BcZVdrIL.js";import{b as n}from"./blockArgTypes-D6A-V3JE.js";import"./preload-helper-PPVm8Dsz.js";import"./styleOptions-Bz1aaV6R.js";const g={title:"Blocks/Pillar Grid",tags:["autodocs"],args:{heading:r.heading,subheading:r.subheading,columns:r.columns,pillars:r.pillars,section_theme:r.section_theme,top_spacing:r.top_spacing,bottom_spacing:r.bottom_spacing},argTypes:{heading:{control:"text",description:"Section heading"},subheading:{control:"text",description:"Subheading below the main heading"},columns:{control:"inline-radio",options:[2,3,4],description:"Number of grid columns"},pillars:{control:"object",description:"Repeater: array of { title, description }"},...n},render:a=>t.jsx(i,{block:{acf_fc_layout:"pillar_grid",...a}})},e={},o={args:{columns:2,section_theme:"dark"}},s={args:{columns:4,pillars:[...r.pillars,{title:"Aftercare",description:"Album design & reprints available."}]}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source},description:{story:"Default: 3-column pillar grid on champagne.",...e.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    columns: 2,
    section_theme: 'dark'
  }
}`,...o.parameters?.docs?.source},description:{story:"2-column dark variant.",...o.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    columns: 4,
    pillars: [...pillarBlock.pillars, {
      title: 'Aftercare',
      description: 'Album design & reprints available.'
    }]
  }
}`,...s.parameters?.docs?.source},description:{story:"4-column with extra pillars.",...s.parameters?.docs?.description}}};const b=["Default","TwoColumnDark","FourColumns"];export{e as Default,s as FourColumns,o as TwoColumnDark,b as __namedExportsOrder,g as default};
