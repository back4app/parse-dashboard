import React from 'react'

const OnboardingIcons = ({ name }) => {
  if (name === 'database') {
    return (
      <svg width="133" height="133" viewBox="0 0 133 133" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path d="M73.7837 49.98C68.8235 50.8836 63.3594 51.3806 57.6154 51.3806C35.009 51.3919 16.6797 43.6209 16.6797 34.0426C16.6797 24.4644 35.009 16.6934 57.6154 16.6934C80.2219 16.6934 98.5512 24.4644 98.5512 34.0426" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16.6797 34.043V55.7521C16.6797 65.3304 35.009 73.1014 57.6154 73.1014C66.0915 73.1014 73.9741 72.0058 80.5018 70.1421" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16.6797 55.9219V77.6311C16.6797 87.2093 35.009 94.9803 57.6154 94.9803C68.0173 94.9803 77.5123 93.3312 84.7343 90.6317" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16.6797 77.2461V98.9553C16.6797 108.534 35.009 116.305 57.6154 116.305C68.0173 116.305 77.5123 114.655 84.7343 111.956" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M24.4395 53.5723V56.3057" stroke="#27AE60" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M24.4395 75.3945V78.1279" stroke="#27AE60" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M24.4395 96.7754V99.5088" stroke="#27AE60" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M108.27 38.3359V49.6423L98.5624 55.3012L88.8547 49.6423V38.3359C84.9022 40.4029 82.1142 44.1868 81.2968 48.6032L81.0281 50.0828C80.0652 55.3464 82.2373 60.7002 86.6041 63.7612L89.325 65.6701C91.2508 67.0255 92.4041 69.2393 92.4041 71.6V111.539C92.4041 113.55 94.0164 115.176 96.0095 115.176H101.115C103.108 115.176 104.721 113.55 104.721 111.539V71.6C104.721 69.228 105.874 67.0142 107.8 65.6701L110.521 63.7612C114.887 60.7002 117.06 55.3464 116.097 50.0828L115.828 48.6032C115.022 44.1868 112.234 40.4029 108.27 38.3359Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M99.0664 107.168H104.721" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
          <filter id="filter0_d_1053_11825" x="-1" y="-1" width="135" height="135" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset/>
            <feGaussianBlur stdDeviation="8"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0.758333 0 0 0 0 0.885526 0 0 0 0 1 0 0 0 0.5 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1053_11825"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1053_11825" result="shape"/>
          </filter>
        </defs>
      </svg>

    )
  }
  if (name === 'cloud-code') {
    return (
      <svg width="144" height="128" viewBox="0 0 144 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path d="M104.102 83.578V79.2353C104.102 77.3897 102.596 75.8938 100.737 75.8938H99.049C98.3082 75.8938 97.6523 75.4113 97.4458 74.7117C96.9357 72.9625 96.2434 71.3099 95.381 69.7417C95.0288 69.1024 95.1381 68.2941 95.6725 67.7754L96.8628 66.5933C98.1746 65.2905 98.1746 63.1794 96.8628 61.8766L93.7778 58.8126C92.4661 57.5098 90.3405 57.5098 89.0288 58.8126L87.8385 59.9948C87.3163 60.5135 86.5146 60.6341 85.8588 60.2843C84.292 59.4278 82.6159 58.7282 80.8547 58.2336C80.1503 58.0285 79.6644 57.3771 79.6644 56.6413V54.9645C79.6644 53.1189 78.1584 51.623 76.3001 51.623H71.9276C70.0693 51.623 68.5632 53.1189 68.5632 54.9645V56.6413C68.5632 57.3771 68.0774 58.0285 67.3729 58.2336C65.6118 58.7402 63.9478 59.4278 62.3689 60.2843C61.7252 60.6341 60.9114 60.5256 60.3891 59.9948L59.1988 58.8126C57.8871 57.5098 55.7616 57.5098 54.4499 58.8126L51.3648 61.8766C50.0531 63.1794 50.0531 65.2905 51.3648 66.5933L52.5551 67.7754C53.0774 68.2941 53.1989 69.0903 52.8466 69.7417C51.9843 71.2978 51.2798 72.9625 50.7818 74.7117C50.5754 75.4113 49.9195 75.8938 49.1786 75.8938H47.4903C45.632 75.8938 44.126 77.3897 44.126 79.2353V83.578C44.126 85.4236 45.632 86.9195 47.4903 86.9195H49.1786C49.9195 86.9195 50.5754 87.402 50.7818 88.1016C51.292 89.8508 51.9843 91.5034 52.8466 93.0716C53.1989 93.7109 53.0895 94.5192 52.5551 95.0379L51.3648 96.22C50.0531 97.5229 50.0531 99.6339 51.3648 100.937L54.4499 104.001C55.7616 105.304 57.8871 105.304 59.1988 104.001L60.3891 102.819C60.9114 102.3 61.713 102.179 62.3689 102.529C63.9357 103.385 65.6118 104.085 67.3729 104.58C68.0774 104.785 68.5632 105.436 68.5632 106.172V107.849C68.5632 109.694 70.0693 111.19 71.9276 111.19H76.3001C78.1584 111.19 79.6644 109.694 79.6644 107.849V106.172C79.6644 105.436 80.1503 104.785 80.8547 104.58C82.6159 104.073 84.2798 103.385 85.8588 102.529C86.5025 102.179 87.3163 102.288 87.8385 102.819L89.0288 104.001C90.3405 105.304 92.4661 105.304 93.7778 104.001L96.8628 100.937C98.1746 99.6339 98.1746 97.5229 96.8628 96.22L95.6725 95.0379C95.1503 94.5192 95.0288 93.723 95.381 93.0716C96.2434 91.5155 96.9478 89.8508 97.4458 88.1016C97.6523 87.402 98.3082 86.9195 99.049 86.9195H100.737C102.596 86.9195 104.102 85.4236 104.102 83.578Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M86.6065 84.331C88.2352 77.4774 83.9614 70.6101 77.0608 68.9924C70.1601 67.3748 63.2457 71.6195 61.617 78.4732C59.9883 85.3268 64.2621 92.1941 71.1627 93.8118C78.0634 95.4294 84.9778 91.1847 86.6065 84.331Z" stroke="#27AE60" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M112.094 80.4169C120.923 76.991 127.179 68.4504 127.179 58.4743C127.179 45.4583 116.563 34.9152 103.458 34.9152C102.511 34.9152 101.563 34.9755 100.64 35.0841C97.0328 24.4566 86.9397 16.8086 75.0247 16.8086C64.5308 16.8086 55.4457 22.7436 50.964 31.4169C50.0045 31.1877 49.0206 31.055 47.9883 31.055C40.9802 31.055 35.3081 36.6885 35.3081 43.6488C35.3081 43.6488 35.3081 43.6609 35.3081 43.6729C25.0206 44.1072 16.8223 52.5151 16.8223 62.8411C16.8223 73.167 25.47 82.0334 36.1462 82.0334" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
          <filter id="filter0_d_1053_11969" x="-1" y="-1" width="146" height="130" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset/>
            <feGaussianBlur stdDeviation="8"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0.758333 0 0 0 0 0.885526 0 0 0 0 1 0 0 0 0.5 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1053_11969"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1053_11969" result="shape"/>
          </filter>
        </defs>
      </svg>

    )
  }
  if (name === 'connect-app') {
    return (
      <svg width="155" height="125" viewBox="0 0 155 125" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path d="M63.2232 57.998L57.3721 65.284L63.2232 72.559" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M79.751 72.559L85.6021 65.284L79.751 57.998" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M74.4176 54.1641L68.5449 76.403" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M120.838 28.7656H22.1248C19.0841 28.7656 16.6191 31.2524 16.6191 34.3199V102.812C16.6191 105.879 19.0841 108.366 22.1248 108.366H120.838C123.879 108.366 126.344 105.879 126.344 102.812V34.3199C126.344 31.2524 123.879 28.7656 120.838 28.7656Z" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M28.6455 22.1871C28.6455 19.1159 31.1069 16.6328 34.1512 16.6328H132.864C135.909 16.6328 138.37 19.1159 138.37 22.1871V90.6681C138.37 93.7393 135.909 96.2224 132.864 96.2224" stroke="#34506F" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16.6191 42.0293H126.344" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
          <ellipse cx="23.9924" cy="35.3758" rx="1.61931" ry="1.63361" fill="#27AE60"/>
          <ellipse cx="35.09" cy="35.3758" rx="1.61931" ry="1.63361" fill="#27AE60"/>
          <ellipse cx="29.5412" cy="35.3758" rx="1.61931" ry="1.63361" fill="#27AE60"/>
          <path d="M56.6924 97.1387H60.039" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M69.3018 97.1387H82.4398" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M26.7998 97.1387H28.1492" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M37.4014 97.1387H47.4411" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M113.605 97.1387H116.315" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M91.6914 97.1387H104.354" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M53.1943 88.5234H62.8346" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M26.6484 88.5234H43.8239" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M72.0859 88.5234H78.0666" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M87.3184 88.5234H94.303" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M103.555 88.5234H116.315" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M138.38 28.7656H131.611" stroke="#34506F" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
          <filter id="filter0_d_967_12581" x="-1" y="-1" width="157" height="127" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset/>
            <feGaussianBlur stdDeviation="8"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0.758333 0 0 0 0 0.885526 0 0 0 0 1 0 0 0 0.5 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_967_12581"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_967_12581" result="shape"/>
          </filter>
        </defs>
      </svg>
    )
  }
  if (name === 'mcp') {
    return <svg width="103" height="90" viewBox="0 0 103 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26.0254 8.80857C26.0254 8.80857 32.0553 1.57541 41.7596 1.55469C46.8054 1.55469 50.8882 5.63759 50.8882 10.6324V20.6842" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28.4535 10.0113C28.4535 10.0113 23.0308 6.19781 18.8853 10.0113C14.8863 13.69 17.3255 19.1305 17.3255 19.1305" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M50.8883 52.5176C50.8883 52.5176 51.5164 61.6678 44.5967 63.1704" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.4671 16.7266C16.4671 16.7266 3.59082 20.8406 8.98212 31.338C8.98212 31.338 -0.847844 38.8406 6.89888 48.5711" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M35.9287 86.8287C52.6888 93.9375 50.8883 75.2432 50.8883 75.2432V20.6836" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M37.436 85.2233C37.436 85.2233 34.9026 88.7362 27.8049 87.6689C19.9745 86.4875 19.1475 80.8398 19.1475 80.8398" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.30662 71.0059C7.58978 82.8193 19.1575 82.8193 19.1575 82.8193" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.19761 47.627C6.19761 47.627 0.021168 51.0466 1.93691 60.9534C3.85266 70.8498 11.5052 71.6373 11.5052 71.6373" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M40.3148 36.8707C40.3148 36.8707 35.9913 39.0365 32.4215 34.8499C28.8622 30.6634 32.2645 25.223 32.2645 25.223C32.2645 25.223 34.9654 20.2074 39.7809 21.5339" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M34.4729 36.5919C34.4729 36.5919 28.799 36.4986 28.7676 42.6541" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M27.8047 71.6684C27.8047 71.6684 29.1447 76.3524 33.9078 76.3835C38.7443 76.4146 39.5923 72.1659 36.6715 70.1348" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M38.4616 20.9013C38.4616 20.9013 35.9282 13.8132 43.0992 11.3262" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M37.7285 74.8906C37.7285 74.8906 39.0161 78.3 42.544 77.8647" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.6299 45.4714C15.6299 45.4714 27.8048 43.6683 22.759 59.6269" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.8063 45.4725C19.8063 45.4725 23.0306 40.83 18.8955 36.6953" stroke="#C1E2FF" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M54.6562 87.8656H61.0107C63.7115 87.8656 65.8995 85.6998 65.8995 83.0262V80.591C65.8995 79.5236 66.6009 78.5806 67.6372 78.2904C70.1916 77.5651 72.6203 76.5599 74.9024 75.3163C75.8446 74.7982 77.0171 74.9744 77.7708 75.7309L79.5086 77.4511C81.4138 79.3371 84.5125 79.3371 86.4178 77.4511L90.9088 73.0055C92.8141 71.1195 92.8141 68.0521 90.9088 66.1661L89.171 64.4459C88.4068 63.6894 88.2393 62.5288 88.7523 61.6065C90.0085 59.3474 91.024 56.9433 91.7568 54.4148C92.0499 53.3889 93.0025 52.6946 94.0808 52.6946H96.5409C99.2418 52.6946 101.43 50.5288 101.43 47.8552V41.5651C101.43 38.8915 99.2418 36.7257 96.5409 36.7257H94.0808C93.0025 36.7257 92.0499 36.0314 91.7568 35.0055C91.024 32.477 90.0085 30.0728 88.7523 27.8138C88.2289 26.8811 88.4068 25.7205 89.171 24.9744L90.9088 23.2542C92.8141 21.3682 92.8141 18.3008 90.9088 16.4148L86.4178 11.9692C84.5125 10.0832 81.4138 10.0832 79.5086 11.9692L77.7708 13.6894C77.0066 14.4459 75.8446 14.6117 74.9024 14.1039C72.6203 12.8604 70.1916 11.8552 67.6372 11.1298C66.6009 10.8397 65.8995 9.89666 65.8995 8.8293V6.39407C65.8995 3.72049 63.7115 1.55469 61.0107 1.55469H54.6562" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M57.8281 24.3535C69.1865 24.3535 78.3988 33.4727 78.3988 44.7162C78.3988 55.9597 69.1865 65.0789 57.8281 65.0789" stroke="#27AE60" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>

  }
  return null;
}

export default OnboardingIcons
