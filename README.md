# Auth Validation


A [Haraka](https://github.com/haraka/haraka) plugin that ensures SMTP auth and email sender (FROM address) matches.

## Configuration

Edit your configuration in:

`config/mail_from.auth_validation`

### [main]

 - validation = option

**options**

`flexible` (default) - matches only the host part eg. *example.com*

`strict` - matches the full address eg. *jdoe@example.com*

### [domains]

A list of domains and their specific validation options eg.:

```
[domains]
example.com = strict
```



