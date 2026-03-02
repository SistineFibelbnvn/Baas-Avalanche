import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def get_docx_text(path):
    if not os.path.exists(path):
        return f"File not found: {path}"
        
    try:
        document = zipfile.ZipFile(path)
        xml_content = document.read('word/document.xml')
        document.close()
        tree = ET.XML(xml_content)
        
        WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
        PARA = WORD_NAMESPACE + 'p'
        TEXT = WORD_NAMESPACE + 't'
        
        paragraphs = []
        for paragraph in tree.iter(PARA):
            texts = [node.text
                     for node in paragraph.iter(TEXT)
                     if node.text]
            if texts:
                paragraphs.append(''.join(texts))
                
        return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error extracting text: {e}"

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python extract_docx.py <in_docx> <out_txt>")
        sys.exit(1)
    
    path = sys.argv[1]
    out = sys.argv[2]
    text = get_docx_text(path)
    with open(out, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Done")
