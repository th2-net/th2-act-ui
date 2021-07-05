# Act-ui
![](https://img.shields.io/github/package-json/v/th2-net/th2-act-ui)
![](https://img.shields.io/github/workflow/status/th2-net/th2-act-ui/build%20&%20publish%20release%20image%20to%20ghcr.io)

This app could be used to manually interact with the system under test. There are two modes of interaction - sending messages to conn components directly or using act components.

This repository only contains a web app. For act-ui to fucntion properly, `act-ui-backend` needs to be deployed and should be accessible on `{act-ui-path}/backend/*`

# Configuration
To include this component in your schema, a following yml file needs to be created
```
apiVersion: th2.exactpro.com/v1
kind: Th2CoreBox
metadata:
  name: act-ui
spec:
  image-name: ghcr.io/th2-net/th2-act-ui
  image-version: 1.0.15
  type: th2-rpt-viewer
  extended-settings:
    resources:
      limits:
        memory: 300Mi
        cpu: 210m
      requests:
        memory: 100Mi
        cpu: 20m

```

# Screenshots
![picture](screenshot.png)
