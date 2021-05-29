//require('dotenv').config()
const { Router } = require('express')
const jwtDecode  = require('jwt-decode')
//const querystring = require('querystring')
const axios = require('axios')
const isEmail = require('validator/lib/isEmail')
//const { stringify } = require('qs')
const router = Router()

router.get('/', async (req, res) => {
  const userData = req.user
  console.log(userData)
  //const idToken = userData.tokens.id_token
  //const decodedIdToken = jwtDecode(idToken)
  //const email = decodedIdToken.email
  //const iat = decodedIdToken.iat
  //const expiry = userData.tokens.expires_in
  //const token_exp = new Date((iat + expiry) * 1000).toLocaleString()
  const { user } = req.user
  res.render('dashboard', { user: user })
})

router.get('/test', async (req, res) => {
  res.render('form', {
    title: "User Termination Dashboard",
    action: "/service/termination",
    fields: [
      { name: 'email', type: 'email', property: 'required'}
    ]
  })
})


router.get('/service/terminate', async (req, res, next) => {
  const user_terminate = req.query.terminate_user

  const validated_email = isEmail(user_terminate)

  if (validated_email  == false && req.user) {
    res.json({ error_message: 'Please enter a valid email!' })
  } else if (validated_email == true && req.user) {
    try {
      const user_find_res = await axios({
        method: 'GET',
        url: `${process.env.OKTA_DOMAIN}/api/v1/users?filter=profile.login+eq+"${user_terminate}"`,
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authorization': `Bearer ${req.user.access_token}`
        }
      }).catch(error => {
          if ( '403' in error) {
            res.json({ message: error.status })
          } else {
            res.json({ message: error.status } )
          }
      })
      console.log(user_find_res)

      //Password Reset

      const user_info = user_find_res.data
      const status = user_find_res.status
      if (user_info == '') {
        res.json({ message: "User was not found or your don't have enough permissions to view account!", status: status })
      } else {
        //TODO Checkups
        const userId = user_info[0].id
        const user_status = user_info[0].status
        const lastLogin = user_info[0].lastLogin
        const lastUpdated = user_info[0].lastUpdated
        const passwordChanged = user_info[0].passwordChanged

        //Password Reset in HUB
        const pw_res_resp = await axios({
          method: 'POST',
          url: `${process.env.OKTA_DOMAIN}/api/v1/users/${userId}/lifecycle/reset_password?sendEmail=false`,
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': `Bearer ${req.user.access_token}`
          }
        }).catch(error => {
          res.json(error.status)
        })

        const pw_res_status = pw_res_resp.status
        const pw_res_data = pw_res_resp.data

        //Session Termination Process in HUB
        const ses_call_resp = await axios({
          method: 'DELETE',
          url: `${process.env.OKTA_DOMAIN}/api/v1/users/${userId}/sessions?ouathTokens=true`,
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': `Bearer ${req.user.access_token}`
          }
        }).catch(error => {
          res.json(error.status)
        })
        if (ses_call_resp !== undefined) {
          const resp_status = JSON.stringify(ses_call_resp.status)
          if ( resp_status == 204 ) {
            res.json({ message: "Password reset and session termination successful!", status: resp_status, pwr_url: pw_res_data })
          } else {
            res.json({ message: "Something went wrong, bad request or insuficient permissions.", status: resp_status })
          }
        } else {
          res.json({ message: 'Something went wrong, elevated access may be required!' })
        }
      }
    } catch(error) {
      console.error(error)
    }
  }
})

module.exports = router
