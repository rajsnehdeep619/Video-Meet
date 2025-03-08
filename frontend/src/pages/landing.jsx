import React from 'react'
import "../App.css"
export default function LandingPage() {
  return (
    <div className='landingPageContainer'>
      <nav>
        <div className='navHeader'>
          <h2>Apna Video Call</h2>
        </div>
        <div className='navlist'>
          <p>Join as Guest</p>
          <p>Register</p>
          <div role='button'>
            <p>Login</p>
          </div>
        </div>
      </nav>
      <div className="landingMainContainer">
        <div>
          <h1><span style={{color:"#FF9839"}}>Connect</span> with your Loved Ones</h1>
          <p>Cover a distance by apna video call</p>
          <div role='button'>
            <a href='/auth'>Get Stared</a>
          </div>
        </div>
        <div>
          <img src="/mobile.png" alt="" />
        </div>
      </div>
    </div>
  )
}
