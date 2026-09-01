import assert from 'node:assert/strict';
import test from 'node:test';
import parser from '../.test-dist/lib/resume/docxParser.js';

const { extractOrderedBlocksFromDocumentXml, renderOrderedHtmlFromDocumentXml } = parser;

test('extracts paragraphs and table rows in Word document order', () => {
  const xml = `
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>个人信息</w:t></w:r></w:p>
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:t>姓名</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>张三</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
        <w:p><w:r><w:t>项目经历</w:t></w:r></w:p>
        <w:p><w:r><w:t>电商后台管理系统</w:t></w:r></w:p>
      </w:body>
    </w:document>
  `;

  const blocks = extractOrderedBlocksFromDocumentXml(xml);

  assert.deepEqual(blocks.map(block => block.text), [
    '个人信息',
    '姓名 | 张三',
    '项目经历',
    '电商后台管理系统',
  ]);
});

test('renders Word tables as tables instead of flattening them in preview', () => {
  const xml = `
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>个人信息</w:t></w:r></w:p>
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:t>姓名</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>张三</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    </w:document>
  `;

  const html = renderOrderedHtmlFromDocumentXml(xml);

  assert.match(html, /<p>个人信息<\/p>/);
  assert.match(html, /<table><tbody><tr><td>姓名<\/td><td>张三<\/td><\/tr><\/tbody><\/table>/);
  assert.doesNotMatch(html, /姓名 \| 张三/);
});

test('does not duplicate paragraphs nested inside Word tables', () => {
  const xml = `
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>顶部标题</w:t></w:r></w:p>
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:t>左栏内容</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>右栏内容</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
        <w:p><w:r><w:t>底部内容</w:t></w:r></w:p>
      </w:body>
    </w:document>
  `;

  const blocks = extractOrderedBlocksFromDocumentXml(xml);
  const html = renderOrderedHtmlFromDocumentXml(xml);

  assert.deepEqual(blocks.map(block => block.text), [
    '顶部标题',
    '左栏内容 | 右栏内容',
    '底部内容',
  ]);
  assert.equal((html.match(/左栏内容/g) || []).length, 1);
  assert.equal((html.match(/右栏内容/g) || []).length, 1);
});

test('ignores Word AlternateContent fallback copies', () => {
  const xml = `
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">
      <w:body>
        <w:p>
          <w:r>
            <mc:AlternateContent>
              <mc:Choice Requires="wps"><w:t>新版内容</w:t></mc:Choice>
              <mc:Fallback><w:t>新版内容</w:t></mc:Fallback>
            </mc:AlternateContent>
          </w:r>
        </w:p>
      </w:body>
    </w:document>
  `;

  const blocks = extractOrderedBlocksFromDocumentXml(xml);
  const html = renderOrderedHtmlFromDocumentXml(xml);

  assert.deepEqual(blocks.map(block => block.text), ['新版内容']);
  assert.equal((html.match(/新版内容/g) || []).length, 1);
});

test('sorts floating Word text boxes by visual position', () => {
  const xml = `
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
      <w:body>
        <w:p><w:r><w:drawing><wp:anchor>
          <wp:positionH><wp:posOffset>2000</wp:posOffset></wp:positionH>
          <wp:positionV><wp:posOffset>2000</wp:posOffset></wp:positionV>
          <w:txbxContent><w:p><w:r><w:t>右下</w:t></w:r></w:p></w:txbxContent>
        </wp:anchor></w:drawing></w:r></w:p>
        <w:p><w:r><w:drawing><wp:anchor>
          <wp:positionH><wp:posOffset>1000</wp:posOffset></wp:positionH>
          <wp:positionV><wp:posOffset>1000</wp:posOffset></wp:positionV>
          <w:txbxContent><w:p><w:r><w:t>左上</w:t></w:r></w:p></w:txbxContent>
        </wp:anchor></w:drawing></w:r></w:p>
      </w:body>
    </w:document>
  `;

  const blocks = extractOrderedBlocksFromDocumentXml(xml);

  assert.deepEqual(blocks.map(block => block.text), ['左上', '右下']);
});
