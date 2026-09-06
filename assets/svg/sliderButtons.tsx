import Svg, { Path } from "react-native-svg";

export const SliderPlusButton = () => {
  return (
    <Svg width="26" height="24" viewBox="0 0 26 24" fill="none">
      <Path
        d="M4 12H20.5"
        stroke="#B4B4B4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 4V20.5"
        stroke="#B4B4B4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const SliderMinusButton = () => {
  return (
    <Svg width="27" height="24" viewBox="0 0 27 24" fill="none">
      <Path
        d="M5 12H21.5"
        stroke="#B4B4B4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
