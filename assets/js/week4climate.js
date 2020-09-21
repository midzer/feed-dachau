const banner = document.createElement('div');
banner.style.position = 'fixed';
banner.style.bottom = 0;
banner.style.left = 0;
banner.style.right = 0;
banner.style.backgroundColor = '#1B7340';
banner.style.height = '80px';
banner.style.textAlign = 'center';

const link = document.createElement('a');
link.style.fontSize = '3rem';
link.href = 'http://fff-dachau.de';
link.textContent = '#KeinGradWeiter Fr, 25.9. 12 Uhr Thoma-Wiese';
banner.appendChild(link);

const footer = document.querySelector('footer');
footer.style.height = parseInt(footer.clientHeight) * 2 + 'px';

document.body.appendChild(banner);
