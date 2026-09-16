export interface RemoteFontSource {
  url: string;
  fileName: string;
}

export interface RemoteFontFaceSet {
  regular: RemoteFontSource;
  bold: RemoteFontSource;
}

const RELEASE_BASE =
  "https://github.com/ssongyc/side-led-banner-app/releases/download/fonts-v1";

export const REMOTE_FONT_FACE_SETS = {
  chiron_goround_tc: {
    regular: {
      url: `${RELEASE_BASE}/ChironGoRoundTC-Medium.ttf`,
      fileName: "ChironGoRoundTC-Medium.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/ChironGoRoundTC-Black.ttf`,
      fileName: "ChironGoRoundTC-Black.ttf",
    },
  },
  zhengfeng_brush: {
    regular: {
      url: `${RELEASE_BASE}/MasaFont-Regular.ttf`,
      fileName: "MasaFont-Regular.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/MasaFont-Bold.ttf`,
      fileName: "MasaFont-Bold.ttf",
    },
  },
  chiron_hei_hk: {
    regular: {
      url: `${RELEASE_BASE}/ChironHeiHK-Medium.ttf`,
      fileName: "ChironHeiHK-Medium.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/ChironHeiHK-Black.ttf`,
      fileName: "ChironHeiHK-Black.ttf",
    },
  },
  gowun_batang: {
    regular: {
      url: `${RELEASE_BASE}/GowunBatang-Regular.ttf`,
      fileName: "GowunBatang-Regular.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/GowunBatang-Bold.ttf`,
      fileName: "GowunBatang-Bold.ttf",
    },
  },
  hahmlet: {
    regular: {
      url: `${RELEASE_BASE}/Hahmlet-Medium.ttf`,
      fileName: "Hahmlet-Medium.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/Hahmlet-Black.ttf`,
      fileName: "Hahmlet-Black.ttf",
    },
  },
  gaegu: {
    regular: {
      url: `${RELEASE_BASE}/Gaegu-Regular.ttf`,
      fileName: "Gaegu-Regular.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/Gaegu-Bold.ttf`,
      fileName: "Gaegu-Bold.ttf",
    },
  },
  nanum_square_neo: {
    regular: {
      url: `${RELEASE_BASE}/NanumSquareNeo-bRg.ttf`,
      fileName: "NanumSquareNeo-bRg.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/NanumSquareNeo-eHv.ttf`,
      fileName: "NanumSquareNeo-eHv.ttf",
    },
  },
  kaisei: {
    regular: {
      url: `${RELEASE_BASE}/KaiseiTokumin-Regular.ttf`,
      fileName: "KaiseiTokumin-Regular.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/KaiseiTokumin-ExtraBold.ttf`,
      fileName: "KaiseiTokumin-ExtraBold.ttf",
    },
  },
  ibm_plex_sans_jp: {
    regular: {
      url: `${RELEASE_BASE}/IBMPlexSansJP_300Light.ttf`,
      fileName: "IBMPlexSansJP_300Light.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/IBMPlexSansJP_700Bold.ttf`,
      fileName: "IBMPlexSansJP_700Bold.ttf",
    },
  },
  dela_gothic_one: {
    regular: {
      url: `${RELEASE_BASE}/ZenKakuGothicNew-Regular.ttf`,
      fileName: "ZenKakuGothicNew-Regular.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/ZenKakuGothicNew-Bold.ttf`,
      fileName: "ZenKakuGothicNew-Bold.ttf",
    },
  },
  mochiy_pop_one: {
    regular: {
      url: `${RELEASE_BASE}/MPLUSRounded1c-Regular.ttf`,
      fileName: "MPLUSRounded1c-Regular.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/MPLUSRounded1c-Bold.ttf`,
      fileName: "MPLUSRounded1c-Bold.ttf",
    },
  },
  noto_serif_tc: {
    regular: {
      url: `${RELEASE_BASE}/NotoSerifTC-Medium.ttf`,
      fileName: "NotoSerifTC-Medium.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/NotoSerifTC-Bold.ttf`,
      fileName: "NotoSerifTC-Bold.ttf",
    },
  },
  lxgw_wenkai_tc: {
    regular: {
      url: `${RELEASE_BASE}/LXGWWenKaiTC-Regular.ttf`,
      fileName: "LXGWWenKaiTC-Regular.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/LXGWWenKaiTC-Bold.ttf`,
      fileName: "LXGWWenKaiTC-Bold.ttf",
    },
  },
  noto_serif_sc: {
    regular: {
      url: `${RELEASE_BASE}/NotoSerifSC_400Regular.ttf`,
      fileName: "NotoSerifSC_400Regular.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/NotoSerifSC_700Bold.ttf`,
      fileName: "NotoSerifSC_700Bold.ttf",
    },
  },
  yrdzst: {
    regular: {
      url: `${RELEASE_BASE}/YangRenDongZhuShiTi-Regular-2.ttf`,
      fileName: "YangRenDongZhuShiTi-Regular-2.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/YangRenDongZhuShiTi-Bold-2.ttf`,
      fileName: "YangRenDongZhuShiTi-Bold-2.ttf",
    },
  },
  tsanger_shuyuan: {
    regular: {
      url: `${RELEASE_BASE}/CangErShuYuanTiW02-2.ttf`,
      fileName: "CangErShuYuanTiW02-2.ttf",
    },
    bold: {
      // GitHub이 업로드 시 중국어 파일명(仓耳舒圆体W05.ttf)을 W05.ttf로 정리함
      url: `${RELEASE_BASE}/W05.ttf`,
      fileName: "W05.ttf",
    },
  },
  syne: {
    regular: {
      url: `${RELEASE_BASE}/Syne-Medium.ttf`,
      fileName: "Syne-Medium.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/Syne-ExtraBold.ttf`,
      fileName: "Syne-ExtraBold.ttf",
    },
  },
  arimo: {
    regular: {
      url: `${RELEASE_BASE}/Arimo-Regular.ttf`,
      fileName: "Arimo-Regular.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/Arimo-Bold.ttf`,
      fileName: "Arimo-Bold.ttf",
    },
  },
  roboto_slab: {
    regular: {
      url: `${RELEASE_BASE}/RobotoSlab-Regular.ttf`,
      fileName: "RobotoSlab-Regular.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/RobotoSlab-Black.ttf`,
      fileName: "RobotoSlab-Black.ttf",
    },
  },
  orbitron: {
    regular: {
      url: `${RELEASE_BASE}/Orbitron-Regular.ttf`,
      fileName: "Orbitron-Regular.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/Orbitron-Black.ttf`,
      fileName: "Orbitron-Black.ttf",
    },
  },
  poppins_medium: {
    regular: {
      url: `${RELEASE_BASE}/Poppins-Medium.ttf`,
      fileName: "Poppins-Medium.ttf",
    },
    bold: {
      url: `${RELEASE_BASE}/Poppins-Black.ttf`,
      fileName: "Poppins-Black.ttf",
    },
  },
} as const satisfies Record<string, RemoteFontFaceSet>;

export type RemoteFontId = keyof typeof REMOTE_FONT_FACE_SETS;
