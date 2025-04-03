import React from 'react'

const OnboardingIcons = ({ name }) => {
  if (name === 'database') {
    return (
      <svg width="133" height="133" viewBox="0 0 133 133" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d_1313_3617)">
          <path d="M73.7835 49.98C68.8233 50.8836 63.3592 51.3806 57.6152 51.3806C35.0087 51.3919 16.6794 43.6209 16.6794 34.0426C16.6794 24.4644 35.0087 16.6934 57.6152 16.6934C80.2217 16.6934 98.551 24.4644 98.551 34.0426" stroke="#C1E2FF" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16.6794 34.043V55.7521C16.6794 65.3304 35.0087 73.1014 57.6152 73.1014C66.0912 73.1014 73.9738 72.0058 80.5016 70.1421" stroke="#C1E2FF" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16.6794 55.9219V77.6311C16.6794 87.2093 35.0087 94.9803 57.6152 94.9803C68.0171 94.9803 77.512 93.3312 84.734 90.6317" stroke="#C1E2FF" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16.6794 77.2461V98.9553C16.6794 108.534 35.0087 116.305 57.6152 116.305C68.0171 116.305 77.512 114.655 84.734 111.956" stroke="#C1E2FF" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M24.439 53.5723V56.3057" stroke="#27AE60" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M24.439 75.3945V78.1279" stroke="#27AE60" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M24.439 96.7754V99.5088" stroke="#27AE60" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M108.27 38.3359V49.6423L98.5621 55.3012L88.8544 49.6423V38.3359C84.902 40.4029 82.1139 44.1868 81.2966 48.6032L81.0278 50.0828C80.0649 55.3464 82.2371 60.7002 86.6039 63.7612L89.3247 65.6701C91.2506 67.0255 92.4039 69.2393 92.4039 71.6V111.539C92.4039 113.55 94.0162 115.176 96.0092 115.176H101.115C103.108 115.176 104.72 113.55 104.72 111.539V71.6C104.72 69.228 105.874 67.0142 107.8 65.6701L110.52 63.7612C114.887 60.7002 117.059 55.3464 116.096 50.0828L115.828 48.6032C115.022 44.1868 112.234 40.4029 108.27 38.3359Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M99.0659 107.168H104.72" stroke="#C1E2FF" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <defs>
          <filter id="filter0_d_1313_3617" x="-1" y="-1" width="135" height="135" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset/>
            <feGaussianBlur stdDeviation="8"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0.758333 0 0 0 0 0.885526 0 0 0 0 1 0 0 0 0.9 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1313_3617"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1313_3617" result="shape"/>
          </filter>
        </defs>
      </svg>
    )
  }
  if (name === 'cloud-code') {
    return (
      <svg width="143" height="128" viewBox="0 0 143 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d_1313_3651)">
          <path d="M103.494 83.578V79.2353C103.494 77.3897 101.999 75.8938 100.153 75.8938H98.4762C97.7404 75.8938 97.089 75.4113 96.8839 74.7117C96.3773 72.9625 95.6897 71.3099 94.8332 69.7417C94.4834 69.1024 94.5919 68.2941 95.1227 67.7754L96.3049 66.5933C97.6077 65.2905 97.6077 63.1794 96.3049 61.8766L93.2409 58.8126C91.9381 57.5098 89.8271 57.5098 88.5242 58.8126L87.3421 59.9948C86.8234 60.5135 86.0272 60.6341 85.3758 60.2843C83.8197 59.4278 82.155 58.7282 80.4058 58.2336C79.7062 58.0285 79.2237 57.3771 79.2237 56.6413V54.9645C79.2237 53.1189 77.7278 51.623 75.8822 51.623H71.5395C69.6939 51.623 68.198 53.1189 68.198 54.9645V56.6413C68.198 57.3771 67.7155 58.0285 67.0159 58.2336C65.2667 58.7402 63.6141 59.4278 62.0459 60.2843C61.4066 60.6341 60.5983 60.5256 60.0796 59.9948L58.8975 58.8126C57.5947 57.5098 55.4836 57.5098 54.1808 58.8126L51.1168 61.8766C49.814 63.1794 49.814 65.2905 51.1168 66.5933L52.299 67.7754C52.8177 68.2941 52.9383 69.0903 52.5885 69.7417C51.732 71.2978 51.0324 72.9625 50.5378 74.7117C50.3327 75.4113 49.6813 75.8938 48.9455 75.8938H47.2687C45.4231 75.8938 43.9272 77.3897 43.9272 79.2353V83.578C43.9272 85.4236 45.4231 86.9195 47.2687 86.9195H48.9455C49.6813 86.9195 50.3327 87.402 50.5378 88.1016C51.0444 89.8508 51.732 91.5034 52.5885 93.0716C52.9383 93.7109 52.8298 94.5192 52.299 95.0379L51.1168 96.22C49.814 97.5229 49.814 99.6339 51.1168 100.937L54.1808 104.001C55.4836 105.304 57.5947 105.304 58.8975 104.001L60.0796 102.819C60.5983 102.3 61.3945 102.179 62.0459 102.529C63.602 103.385 65.2667 104.085 67.0159 104.58C67.7155 104.785 68.198 105.436 68.198 106.172V107.849C68.198 109.694 69.6939 111.19 71.5395 111.19H75.8822C77.7278 111.19 79.2237 109.694 79.2237 107.849V106.172C79.2237 105.436 79.7062 104.785 80.4058 104.58C82.155 104.073 83.8076 103.385 85.3758 102.529C86.0151 102.179 86.8234 102.288 87.3421 102.819L88.5242 104.001C89.8271 105.304 91.9381 105.304 93.2409 104.001L96.3049 100.937C97.6077 99.6339 97.6077 97.5229 96.3049 96.22L95.1227 95.0379C94.604 94.5192 94.4834 93.723 94.8332 93.0716C95.6897 91.5155 96.3893 89.8508 96.8839 88.1016C97.089 87.402 97.7404 86.9195 98.4762 86.9195H100.153C101.999 86.9195 103.494 85.4236 103.494 83.578Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M86.1179 84.331C87.7355 77.4774 83.4908 70.6101 76.6372 68.9924C69.7835 67.3748 62.9162 71.6195 61.2986 78.4732C59.681 85.3268 63.9256 92.1941 70.7793 93.8118C77.6329 95.4294 84.5003 91.1847 86.1179 84.331Z" stroke="#27AE60" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M111.432 80.4169C120.202 76.991 126.414 68.4504 126.414 58.4743C126.414 45.4583 115.871 34.9152 102.855 34.9152C101.914 34.9152 100.973 34.9755 100.057 35.0841C96.4738 24.4566 86.4494 16.8086 74.6156 16.8086C64.1931 16.8086 55.17 22.7436 50.7187 31.4169C49.7658 31.1877 48.7886 31.055 47.7633 31.055C40.8029 31.055 35.1695 36.6885 35.1695 43.6488C35.1695 43.6488 35.1695 43.6609 35.1695 43.6729C24.9521 44.1072 16.8096 52.5151 16.8096 62.8411C16.8096 73.167 25.3984 82.0334 36.0018 82.0334" stroke="#C1E2FF" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <defs>
          <filter id="filter0_d_1313_3651" x="-1" y="-1" width="145.224" height="130" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset/>
            <feGaussianBlur stdDeviation="8"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0.758333 0 0 0 0 0.885526 0 0 0 0 1 0 0 0 0.9 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1313_3651"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1313_3651" result="shape"/>
          </filter>
        </defs>
      </svg>
    )
  }
  if (name === 'connect-app') {
    return (
      <svg width="155" height="125" viewBox="0 0 155 125" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d_1313_3677)">
          <path d="M63.2232 57.9961L57.3721 65.282L63.2232 72.557" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M79.751 72.557L85.6021 65.282L79.751 57.9961" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M74.4181 54.1641L68.5454 76.403" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M120.838 28.7656H22.1248C19.0841 28.7656 16.6191 31.2524 16.6191 34.3199V102.812C16.6191 105.879 19.0841 108.366 22.1248 108.366H120.838C123.879 108.366 126.344 105.879 126.344 102.812V34.3199C126.344 31.2524 123.879 28.7656 120.838 28.7656Z" stroke="#C1E2FF" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M28.6453 22.1871C28.6453 19.1159 31.1066 16.6328 34.1509 16.6328H132.864C135.908 16.6328 138.37 19.1159 138.37 22.1871V90.6681C138.37 93.7393 135.908 96.2224 132.864 96.2224" stroke="#34506F" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16.6191 42.0312H126.344" stroke="#C1E2FF" stroke-linecap="round" stroke-linejoin="round"/>
          <ellipse cx="23.9924" cy="35.3758" rx="1.61931" ry="1.63361" fill="#27AE60"/>
          <ellipse cx="35.09" cy="35.3758" rx="1.61931" ry="1.63361" fill="#27AE60"/>
          <ellipse cx="29.5412" cy="35.3758" rx="1.61931" ry="1.63361" fill="#27AE60"/>
          <path d="M56.6919 97.1367H60.0385" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M69.3008 97.1367H82.4388" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M26.7993 97.1367H28.1487" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M37.4004 97.1367H47.4401" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M113.605 97.1367H116.315" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M91.6904 97.1367H104.353" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M53.1941 88.5234H62.8344" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M26.6482 88.5234H43.8237" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M72.0859 88.5234H78.0666" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M87.3184 88.5234H94.303" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M103.555 88.5234H116.315" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M138.381 28.7656H131.612" stroke="#34506F" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <defs>
          <filter id="filter0_d_1313_3677" x="-1" y="-1" width="157" height="127" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset/>
            <feGaussianBlur stdDeviation="8"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0.758333 0 0 0 0 0.885526 0 0 0 0 1 0 0 0 0.9 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1313_3677"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1313_3677" result="shape"/>
          </filter>
        </defs>
      </svg>

    )
  }
  return null;
}

export default OnboardingIcons
