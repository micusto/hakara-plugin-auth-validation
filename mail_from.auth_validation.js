var utils = require('haraka-utils');
var addr  = require('address-rfc2821');

// register plugin
exports.register = function () {
    var plugin = this;

    // initial load of plugin config
    plugin.load_config();
}

// load (and reload) config
exports.load_config = function () {
    var plugin = this;

    // load config - update if file changes
    plugin.cfg = plugin.config.get('mail_from.auth_validation', 'ini', function() {
        plugin.load_config();
    });

    // ensure cfg.main
    if (!plugin.cfg.hasOwnProperty('main')) {
        plugin.cfg.main = {}
    }

    // ensure cfg.main.validation (set default value if needed)
    if (!plugin.cfg.main.hasOwnProperty('validation') || (plugin.cfg.main.validation !== 'strict' && plugin.cfg.main.validation !== 'flexible')) {
        plugin.cfg.main.validation = 'flexible'
    }

    // ensure cfg.domains
    if (!plugin.cfg.hasOwnProperty('domains')) {
        plugin.cfg.domains = {}
    }

    plugin.logdebug(plugin, plugin.cfg);
}

// hook to perform validation of mail addresses
exports.hook_mail = function (next, connection, params) {
    var plugin = this;

    // get mail addresses
    var mail_from = params[0];
    if (connection.hasOwnProperty('notes') && connection.notes.hasOwnProperty('auth_user')) {
        // parse auth_users, using address-rfc2821
        var auth_user = new addr.Address('<'+ connection.notes.auth_user.toLowerCase() +'>');
    }

    // ensure we are working with addr.Address objects
    if (!(auth_user instanceof addr.Address) || !(mail_from instanceof addr.Address)) {
        return next(CONT, 'skipping validation, address is not an object');
    }

    // use default validation type, or domain specific type
    var validation = plugin.cfg.main.validation.toLowerCase()
    if (plugin.cfg.domains.hasOwnProperty(mail_from.host)) {
        validation = plugin.cfg.domains[mail_from.host].toLowerCase()
    }

    // validation rules
    if (validation === 'flexible' && mail_from.host !== auth_user.host) {
        connection.transaction.results.add(plugin, { fail: validation, emit: true });
        return next(DENY, auth_user.address() + ' failed flexible auth validation.');
    } else if (validation === 'strict' && mail_from.address() !== auth_user.address()) {
        connection.transaction.results.add(plugin, { fail: validation, emit: true });
        return next(DENY, auth_user.address() + ' failed strict auth validation.');
    } else {
        connection.transaction.results.add(plugin, { pass: validation, emit: true });
    }

    return next();
}
