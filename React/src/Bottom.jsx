import React from "react";
import { FaFacebook } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { CiLinkedin } from "react-icons/ci";

export const Bottom = ()=>{
    return(
        <>
        <div id="bottom">
            <div id="bottom_content">
      <p>Developed and designed by <span id="author">R</span><b>ajan</b>, Thanks for using MetaFetch - A fast URL preview and metadata inspector</p>
      <div id="social_media_link">
         <a rel="stylesheet" href="https://www.facebook.com/share/19VT4PAww4/?mibextid=wwXIfr"><FaFacebook color="white" size={30}/></a>
         <a href="https://www.instagram.com/palrajan196?igsh=MXdjcTdicjhtNGhkbQ%3D%3D&utm_source=qr"><FaInstagram color="white" size={30}/></a>
         <a href="https://www.linkedin.com/in/rajan-pal-7146012a2"><CiLinkedin color="white" size={30}/></a>
      </div>
      </div>
    </div>
        </>
    )
}