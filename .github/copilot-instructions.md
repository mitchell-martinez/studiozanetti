This repo is the frontend for a professional photography site.
This repo supplies components to a WordPress backend configured with the ACF to REST API plugin.
The components are designed to be ACF Flexible Content blocks that can be added to pages in the WordPress admin interface, and are built with React and TypeScript.
The frontend is built with React Router and TypeScript, and uses SCSS modules for styling. 
The frontend is built with Vite, and the code is organized into a components directory and a pages directory. 
The components directory contains reusable components, while the routes directory contains some basic fallback pages for the site as well as slug pages allowing the WordPress site admin to create new pages via the WordPress admin interface.
All code must be written in a way that allows it to be used by the no-code WYSIWYG editor in the WordPress admin interface, so that the site admin can create new pages and add the components made in this repo to those pages without needing to write any code himself.
The components in this repo should be designed to be as flexible and reusable as possible, so that they can be used in a variety of different contexts on the site. The WordPress admin should have as many customisation options for the components as possible, so that they can be easily adapted to fit the needs of different pages on the site.
All components should be designed with Readme's on how to add them into the WordPress admin interface, and how to use them in the WYSIWYG editor. The Readme's should be written in a way that is easy for non-technical users to understand, and should include screenshots and examples where possible.
The website is hosted on a VPS on Mammoth Cloud and deploys via a Docker Image.
All components should be usable in the WordPress admin panel and designed to be used there.
All components should be as performant and speedy as possible.
All components should be designed with accessibility in mind, and should follow best practices for web accessibility to at least WCAG 2.1 AA standards.
All components should be designed to be mobile-friendly and responsive, so that they look good and function well on a variety of different screen sizes and devices.
All components should be designed to be SEO-friendly, with proper use of HTML tags and attributes to ensure that they are easily indexed by search engines.
All pages should be designed to be fast-loading and optimized for performance, with minimal use of large images and other resources that can slow down the site as well as SEO and accessibility in mind.
Write test cases for all components, using React Testing Library, to ensure that they are working correctly and to catch any bugs or issues before they are deployed to production.
Minimise creating hard coded routes to allow for the WordPress admin to have maximum flexibility to create and delete pages as they see fit, and to allow for the site to grow and evolve over time without needing to make changes to the codebase.
Each component should be split into its own folder, with the component file at index.tsx, a dedicated types file to reduce clutter in the TSX, an SCSS module for styling, a Readme file with instructions on how to use the component in the WordPress admin interface and the WYSIWYG editor, and specific subfolders for tests and helpers with test files and helpers in them. Any subcomponents should go into their own separate folders.
Proactively anticipate future requirements, components, and features that may be needed for the site, and design the codebase in a way that allows for easy addition of new components and features in the future without needing to make major changes to the existing codebase. This includes designing components to be as flexible and reusable as possible, and using a modular architecture that allows for easy addition of new components and features without needing to make major changes to the existing codebase.
