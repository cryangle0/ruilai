function() {
  return new Promise(function(resolve) {
    try {
      if (typeof wx.requirePrivacyAuthorize !== 'function') {
        resolve({ noapi: true })
        return
      }
      wx.requirePrivacyAuthorize({
        success: function() { resolve({ ok: true }) },
        fail: function(e) { resolve({ ok: false, e: e }) }
      })
    } catch (err) {
      resolve({ throw: String(err) })
    }
  })
}
