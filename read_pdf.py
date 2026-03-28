import sys
import subprocess

try:
    import pypdf
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pypdf', '--quiet'])
    import pypdf

reader = pypdf.PdfReader(r'd:\IT342_G3_AnniMemo\SDD_AnniMemo_Racaza.pdf')
text = ''
for page in reader.pages:
    text += page.extract_text() + '\n'

with open(r'd:\IT342_G3_AnniMemo\pdf_content.txt', 'w', encoding='utf-8') as f:
    f.write(text)
print('PDF content extracted to pdf_content.txt')
