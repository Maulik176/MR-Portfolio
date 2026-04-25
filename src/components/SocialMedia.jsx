import React from 'react';
import { BsLinkedin, BsInstagram, BsGithub } from 'react-icons/bs';

const SocialMedia = () => (
  <div className="app__social">
    <div>
      <a href="https://www.linkedin.com/in/maulik-ranadive/"><BsLinkedin />
      </a>
    </div>
    <div>
      <a href="https://www.instagram.com/__maulik__17__/" ><BsInstagram />
      </a>
    </div>
    <div>
      <a href="https://github.com/Maulik176" ><BsGithub/>
      </a>
    </div>
  </div>
);

export default SocialMedia;