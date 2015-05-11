var topScore = 0;
window.onload = function () {
    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
};
window.fbAsyncInit = function () {
    FB.init({
        appId: '842970172461006',
        xfbml: true,
        version: 'v2.3'
    });
    var game = new NinJump.Game();
};
//# sourceMappingURL=app.js.map