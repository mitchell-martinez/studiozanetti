# Navigation and site menus

There are two separate menu decisions:

1. **What links appear:** managed in **Appearance > Menus > Edit Menus**.
2. **Which header menu a page uses:** managed through the page's **Menu Override** or the visual **Site Menus** view.

Moving a page in Site Menus does not add a visible navigation link. Adding a link to a menu does not change the page's Menu Override.

## Change visible navigation

1. Open **Appearance > Menus** and select the intended menu before editing.
2. Add an existing page or category, or add a custom link only when a normal WordPress item cannot represent the destination.
3. Drag items into order. Indent an item beneath a parent to create a dropdown level.
4. Expand a menu item to adjust its visitor-facing Navigation Label without renaming the underlying page.
5. Remove obsolete menu items without deleting their underlying pages.
6. Confirm the primary menu is assigned to **Primary Navigation**, then choose **Save Menu**.

A page must exist before it can be added as a page item. Publishing a page does not add it automatically. If a page title changes, an existing custom Navigation Label may not change with it; check the menu explicitly.

## Assign a page to a header

Use **Site Menus** to see pages grouped by their Menu Override. Drag or move a page to the intended menu and wait for **All changes saved**. This view includes unpublished pages so assignments can be prepared before launch. An unassigned page falls back to Primary when no valid override is present.

Category Menu Override can determine the header used by blog posts in that category. Confirm the category assignment when a post appears beneath the wrong header.

## Check the result

- Preview the page itself and inspect both desktop and mobile navigation.
- Test the parent and each dropdown destination.
- Confirm external custom links use the intended complete address.
- Check that a removed link did not remove the only visitor path to an important published page.

Website Help cannot create, reorder, assign, or save menu items. Contact the webmaster for menu behavior, mobile interaction, more complex nesting, redirects, or destination rules not represented by the current controls.