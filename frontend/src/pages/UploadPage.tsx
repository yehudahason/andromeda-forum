import React from "react";
import ImageUpload from "../components/ImageUpload";

export default function UploadPage() {
  return (
    <div>
      <ImageUpload onUploaded={(url: string) => console.log(url)} />
    </div>
  );
}
