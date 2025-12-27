import React, { useRef } from 'react';
import ImageEditor from '@toast-ui/react-image-editor';
import 'tui-image-editor/dist/tui-image-editor.css';

interface Props {
  imageUrl: string;
  onSave: (file: File) => void;
  onCancel: () => void;
}

export default function DirectEditor({ imageUrl, onSave, onCancel }: Props) {
  const editorRef = useRef<any>(null);

  const handleSave = () => {
    const editorInstance = editorRef.current.getInstance();
     
    const dataUrl = editorInstance.toDataURL();
    
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], "edited_image.png", { type: mimeString });

    onSave(file); 
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'white' }}>
      <div style={{ height: '50px', display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
        <button onClick={onCancel}>취소</button>
        <button onClick={handleSave} style={{ fontWeight: 'bold', color: 'blue' }}>완료(업로드)</button>
      </div>
      <ImageEditor
        ref={editorRef}
        includeUi={{
          loadImage: {
            path: imageUrl,
            name: 'SampleImage',
          },
          menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'filter'],
          initMenu: 'filter',
          uiSize: { width: '100%', height: 'calc(100vh - 60px)' },
          menuBarPosition: 'bottom',
        }}
        cssMaxHeight={500}
        cssMaxWidth={700}
        selectionStyle={{ cornerSize: 20, rotatingPointOffset: 70 }}
        usageStatistics={false}
      />
    </div>
  );
}