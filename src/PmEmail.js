module.exports = {
  emailBody: (messages, title, clientId) => {
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" 

        "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><head></head><body 
        
        style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; 
        
        -ms-text-size-adjust: 100%; -webkit-font-smoothing: antialiased; 
        
        background-color: #000000;"><div class="ap2-tinymce body">
        
            <div style="display: none; max-height: 0px; overflow: hidden;">${title}</div>
        
            
        
            <div style="display: none; max-height: 0px; overflow: hidden;">&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;&#xA0;&#x200C;</div>
        
            
        
        <table cellpadding="0" cellspacing="0" border="0" width="100%" 
        
        style="border-collapse: collapse; mso-table-lspace: 0px; mso-table-rspace: 
        
        0px;">
        
            <tbody><tr>
        
        <td align="center" valign="top" style="border-collapse: collapse; 
        
        mso-line-height-rule: exactly;">
        
        <table cellpadding="0" cellspacing="0" border="0" width="640" 
        
        class="main_table" style="border-collapse: collapse; mso-table-lspace: 0px; 
        
        mso-table-rspace: 0px;">
        
            <tbody><tr>
        
            <td bgcolor="#000000" align="left" valign="top" 
        
        style="border-collapse: collapse; mso-line-height-rule: exactly;">
        
                <table cellpadding="0" cellspacing="0" border="0" 
        
        width="100%" style="border-collapse: collapse; mso-table-lspace: 0px; 
        
        mso-table-rspace: 0px;">
        
                <tbody><tr>
        
                    <td align="left" valign="top" style="border-collapse: 
        
        collapse; mso-line-height-rule: exactly;">
        
                    <table cellpadding="0" cellspacing="0" border="0" 
        
        width="100%" style="border-collapse: collapse; mso-table-lspace: 0px; 
        
        mso-table-rspace: 0px;">
        
                        <tbody><tr>
        
            
        
        
                                
        
                                <tbody><tr>
        
                                    <td align="center" valign="top" 
        
        style="border-collapse: collapse; mso-line-height-rule: exactly; 
        
        font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #FFFFFF; 
        
        padding-top: 20px;" >
        

                                    
        
                                    </td>
        
                                </tr>
        
                                <tr>
        
                                <img style="width:100px;" src="https://s3.amazonaws.com/steps-application-public/ideo_assets/roologo.png" />
                                </tr>
        
                                
        
                                <tr class="celebration-image">
        
                                    <td align="center" valign="top" 
        
        style="border-collapse: collapse; mso-line-height-rule: exactly; 
        
        padding-top: 80px;" class="headerpad">



        <img alt="roo-media" src="https://api.twilio.com/2010-04-01/Accounts/AC59711e3b10a9f3d555631d8017723cf2/Messages/MM9938edb77bdd5a0f76f01abf06b7d59b/Media/ME51d7818ca15d0b4e7a447a6ea6151593"
        
        width="200" alt="celebration email" border="0" style="display: block; border: 0; outline: 
        
        none;" class="img2">



        
        
                                    </td>
        
                                </tr>

                                <tr class="banner-message">
                                <td align="center" valign="top" >    
                                <h1 style="color: white;"> ${title} </h1>
                                </td>
                                </tr>
                        
        

                                <tr class="banner-message">
                                <td align="center" valign="top" >    
                                <h2 style="color: #3ea6ff;"> Here is a complete log of the chat. </h2>
                                <hr style="border-style: solid; border-color: grey; border-width: 0.5px;">
                                </td>
                                </tr>


                                <tr>
        
                                    <td class="mobpad2 ap_editable" 
        
        align="left" valign="top" style="border-collapse: collapse; mso-line-height-rule: 
        
        exactly; font-family: Arial, Helvetica, sans-serif; font-size: 17px; 
        
        line-height: 28px; color: #999999; padding-top: 50px; padding-left: 50px; 
        
        padding-right: 50px;">
        
                                    <br>
        
                                    <br>
                                    <div style="width:800px; display: block;">
${messages.map((obj) => {
    // checks if the message was sent by the user and displays it with appropriate style (right side of chat log)
    if (obj.from_user === clientId) {
      // checks if text is an image and displays it as an image
      if (obj.text.includes('undefined')) {
        return (`<div class="sent" style="background-color:#335f85; color:white; display: block; float:right; clear:both; margin: 10px 0; padding:10px; border-radius: 5px; min-width: 10% !important; max-width:80% !important; overflow: auto;"><img src="${obj.text.split('\n').pop()}" />
        </div>`);
      }
      return (`<div class="sent" style="background-color:#335f85; color:white; display: block; float:right; clear:both; margin: 10px 0; padding:10px; border-radius: 5px; min-width: 10% !important; max-width:80% !important; overflow: auto;">${obj.text}
</div>`);
    }
    if (obj.text.includes('undefined')) {
      return (`<div style="background-color:#343434; color:white; display: block; float:left; clear:both; margin: 10px 0; padding:10px; border-radius: 5px; min-width: 10% !important; max-width:80% !important; overflow: auto;"><img style="width:250px;" src="${obj.text.split('\n').pop()}" />
    </div>`);
    }
    return (`<div style="background-color:#343434; color:white; display: block; float:left; clear:both; margin: 10px 0; padding:10px; border-radius: 5px; min-width: 10% !important; max-width:80% !important; overflow: auto; ">${obj.text}
</div>`);
  }).join('')
}

    </div>
        
                                </tr>
    
                                <tr>
        
                                    <td align="center" valign="top" 
        
        style="border-collapse: collapse; mso-line-height-rule: exactly; 
        
        padding-top: 50px; padding-bottom: 15px;">
        
                                    <table cellpadding="0" cellspacing="0"
        
        border="0" width="100%" style="border-collapse: collapse; mso-table-lspace:
        
        0px; mso-table-rspace: 0px;">
        
                                        <tbody><tr>
        
                                        <td align="center" valign="top" 
        
        style="border-collapse: collapse; mso-line-height-rule: exactly; 
        
        border-top: 1px solid #3A3D41;">
        
                                            <table cellpadding="0" 
        
        cellspacing="0" border="0" width="100%" align="center" style="border-collapse: 
        
        collapse; mso-table-lspace: 0px; mso-table-rspace: 0px; background-color: 
        
        #000000;" bgcolor="#000000">
        
                                            <tbody>
                                            <tr>
                                            <td align="center" style="color:white;">
                                            <h1>Roo</h1>
                                            </td>
                                            </tr>
        
                                            <tr>
        
                                                
        
                                            </tr>
        
                                            <tr>
        
                                                <td align="center" 
        
        valign="top" style="border-collapse: collapse; mso-line-height-rule: 
        
        exactly; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: 
        
        #707478;">&#xA9; 2019 <a href="helloroo.org" 
        
        target="_blank" style="border-collapse: collapse; mso-line-height-rule: 
        
        exactly; text-decoration: none; color: #707478;">helloroo.org</a>
        
        
                                                </td>
        
                                            </tr>
        
                                        
        
                                            </tbody></table>
        
                                        </td>
        
                                        </tr>
        
                                    </tbody></table>
        
                                    </td>
        
                                </tr>
        
                                
        
                                </tbody></table>
    
        
                        </td>
        
                        </tr>
        
                    </tbody></table>
        
                    </td>
        
                </tr>
        
                </tbody></table>
        
            </td>
        
            </tr>
        
        </tbody></table>
        
        </td>
        
            </tr>
        
            </tbody></table>
        
        
        
        
        
        </div><style type="text/css">.body.ap2-tinymce{margin:0 !important;padding:0
        
        !important;-webkit-text-size-adjust:100% !important;-ms-text-size-adjust:100% 
        
        !important;-webkit-font-smoothing:antialiased !important;background-color:#000000 
        
        !important;}.ap2-tinymce img{border:0 !important;outline:none 
        
        !important;}.ap2-tinymce p{margin:0px !important;padding:0px !important;}.ap2-tinymce 
        
        table{border-collapse:collapse;mso-table-lspace:0px;mso-table-rspace:0px;}.ap2-tinymce 
        
        td,.ap2-tinymce a,.ap2-tinymce span{border-collapse:collapse;mso-line-height-rule:exactly;}.ap2-tinymce 
        
        .ExternalClass *{line-height:100%;}.ap2-tinymce a[x-apple-data-detectors]{color:inherit 
        
        !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit 
        
        !important;font-weight:inherit !important;line-height:inherit 
        
        !important;}.ap2-tinymce .appleLinks a{color:#666666;text-decoration:none;}.ap2-tinymce 
        
        .appleLinksBlack a{color:#000001;text-decoration:none;}.ap2-tinymce 
        
        .buttonhover:hover{background-color:#020202 !important;color:#FFFFFF 
        
        !important;}@media only screen and (max-width:480px){table[class=main_table]{width:100% 
        
        !important;}td[class=hide],br[class=hide]{display:none !important;}td[class=logo]{padding-left:15px 
        
        !important;}td[class=mobpad]{padding:15px !important;}td[class=mobpad2]{padding-left:15px 
        
        !important;padding-right:15px !important;}td[class=nopad]{padding-top:0 
        
        !important;padding-right:0 !important;padding-bottom:0 !important;padding-left:0 
        
        !important;}td[class=headerpad]{padding-top:60px !important;}img[class=img]{width:100% 
        
        !important;height:auto !important;}img[class=img2]{width:80% !important;margin-top:20px 
        
        !important;height:auto !important;}img[class=img3]{width:65% !important;height:auto 
        
        !important;}a[class=mobcta]{width:216px !important;height:auto 
        
        !important;line-height:36px !important;font-size:12px !important;text-align:center 
        
        !important;margin-top:90px !important;margin-bottom:50px !important;}div[class=show]{display:block 
        
        !important;margin:0 !important;padding:0 !important;overflow:visible 
        
        !important;width:auto !important;max-height:inherit !important;}*[class=mobilewrapper]{width:100%!important;height:auto!important;}*[class=w320]{width:100%!important;height:auto!important;}td[class=bkgrnd]{background-image:url(https://s3.amazonaws.com/frameio-email-marketing/_email_assets/ad_hoc/frameio_masters/EmailBG_Static.png) 
        
        !important;width:100% !important;background-repeat:no-repeat !important;background-size:auto 
        
        !important;background-color:#000000 !important;}*[class=pTopCTA]{padding-top:100px 
        
        !important;}*[class=pTopVID]{padding-top:20px !important;}}@media only 
        
        screen and (min-width:480px) and (max-width:640px){table[class=main_table]{width:100% 
        
        !important;}td[class=hide],br[class=hide]{display:none !important;}td[class=logo]{padding-left:15px 
        
        !important;}td[class=mobpad]{padding:15px !important;}td[class=mobpad2]{padding-left:15px 
        
        !important;padding-right:15px !important;}td[class=nopad]{padding-top:0 
        
        !important;padding-right:0 !important;padding-bottom:0 !important;padding-left:0 
        
        !important;}img[class=img]{width:100% !important;height:auto !important;}img[class=img2]{width:80% 
        
        !important;margin-top:20px !important;height:auto !important;}img[class=img3]{width:65% 
        
        !important;height:auto !important;}td[class=headerpad]{padding-top:60px 
        
        !important;}a[class=mobcta]{width:216px !important;height:auto 
        
        !important;line-height:36px !important;font-size:12px !important;text-align:center 
        
        !important;margin-top:90px !important;margin-bottom:50px !important;}div[class=show]{display:block 
        
        !important;margin:0 !important;padding:0 !important;overflow:visible 
        
        !important;width:auto !important;max-height:inherit !important;}*[class=mobilewrapper]{width:100%!important;height:auto!important;}*[class=w320]{width:100%!important;height:auto!important;}td[class=bkgrnd]{background-image:url(https://s3.amazonaws.com/frameio-email-marketing/_email_assets/ad_hoc/frameio_masters/EmailBG_Static.png) 
        
        !important;width:100% !important;background-repeat:no-repeat !important;background-size:auto 
        !important;background-color:#000000 !important;}*[class=pTopCTA]{padding-top:100px 
        
        !important;}*[class=pTopVID]{padding-top:20px !important;}}
        
        .gr-textarea-btn { overflow:hidden !important; max-height: 0 !important; 
        
        width: 0 !important; margin: 0!important; margin-left: 0!important; 
        
        margin-right: 0!important; margin-top: 0!important; margin-bottom: 
        
        0!important; padding:0 !important; padding-left:0 !important; 
        
        padding-right:0 !important; padding-top:0 !important; padding-bottom:0 
        
        !important; display: none !important; opacity: 0 !important; z-index: 0 
        
        !important; } 
        
        body {margin: 0; padding:0;}</style>
        
        </body></html>`;
  }
};
