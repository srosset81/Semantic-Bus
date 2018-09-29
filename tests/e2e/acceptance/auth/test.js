Feature('Test acceptance ');

Scenario('Test the admin panel in the admin dashboard @local', (I) => {
  // Access to the admin menu
  I.amOnPage('/auth/login.html#connexion');
  // I.amOnPage('http://localhost:8080/dashboard/');
  I.seeInCurrentUrl('semanticbus.docker/auth/login.html#connexion');
  I.wait(5);
  // I.seeInCurrentUrl('semanticbus.docker/');
  I.grabBrowserLogs()
   .then((logs) => {
     console.log(JSON.stringify(logs));
  });

  I.see('Bienvenue sur Grappe')
  I.saveScreenshot('bus.png');
});
