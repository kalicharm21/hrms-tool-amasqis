import React from "react";
import { img_path } from "../../../environment";

interface Image {
  className?: string;
  src: string;
  alt?: string;
  height?: number;
  width?: number;
  id?: string;
  isLink?: boolean; // New optional prop
}

const ImageWithBasePath = (props: Image) => {
  // Use full path only if isLink is false or undefined
  const fullSrc = props.isLink ? props.src : `${img_path}${props.src}`;

  return (
    <img
      className={props.className}
      src={fullSrc}
      height={props.height}
      alt={props.alt}
      width={props.width}
      id={props.id}
    />
  );
};

export default ImageWithBasePath;
