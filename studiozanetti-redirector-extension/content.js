// Redirect studiozanetti.com.au links to mitchellmartinez.tech equivalent when on mitchellmartinez.tech

document.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href) return;

  // Create a URL object to parse the link
  let targetUrl;
  try {
    targetUrl = new URL(href, window.location.href);
  } catch {
    // Invalid URL, let it proceed normally
    return;
  }

  // Check if the target URL is studiozanetti.com.au
  if (targetUrl.hostname === 'studiozanetti.com.au' || targetUrl.hostname === 'www.studiozanetti.com.au') {
    // Replace with mitchellmartinez.tech equivalent
    const newUrl = new URL(targetUrl.href);
    newUrl.hostname = 'studiozanetti.mitchellmartinez.tech';
    
    // Prevent default navigation and navigate to the new URL
    event.preventDefault();
    window.location.href = newUrl.href;
  }
}, true); // Use capture phase to intercept clicks early
