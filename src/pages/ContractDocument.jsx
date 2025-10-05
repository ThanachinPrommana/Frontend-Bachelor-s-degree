import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'; // <-- ให้เหลือ - ตัวเดียว
Font.register({
  family: 'Sarabun',
  fonts: [
    { src: '/fonts/Sarabun-Regular.ttf' }, // path to font file
    { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' },
  ],
});
// สร้าง Stylesheet (เหมือนเดิม)
const styles = StyleSheet.create({
  // ... (style ทั้งหมดของคุณเหมือนเดิม)
  page: {
    fontFamily: 'Sarabun',
    padding: 50,
    fontSize: 11,
    lineHeight: 1.2,
    color: '#333'
  },
  header: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 12,
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  label: {
    marginRight: 8,
    paddingBottom: 2,
    flexShrink: 0,
  },
  input: {
    borderBottom: '1px dotted black',
    paddingBottom: 2,
    minHeight: 12,
    flexGrow: 1,
  },
  signatureBox: {
    border: '1px solid #ccc',
    height: 80,
    width: 200,
    marginTop: 10,
    marginBottom: 5,
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  signatureContainer: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureColumn: {
    textAlign: 'center',
    marginBottom: 10, // เพิ่มระยะห่างเพื่อให้ดูไม่ชิดกันเกินไป
  },
  bold: {
    fontWeight: 'bold',
  },
  inputFullWidth: {
    borderBottom: '1px dotted black',
    width: '100%',
    paddingBottom: 2,
    minHeight: 12,
  },
});


// ***** 1. เพิ่มฟังก์ชัน Helper นี้เข้าไป *****
const addSoftHyphens = (text) => {
  if (!text || typeof text !== 'string') return ' ';
  return text
    // รวมพยัญชนะกับวรรณยุกต์เป็นหนึ่งกลุ่ม
    .normalize('NFC')
    // แล้วค่อยแทรก zero-width space
    .split(/(?=[ก-ฮ])/).join('\u200B');
};


const ContractDocument = ({ data, buyerSignature, sellerSignature, witness1Signature, 
  witness2Signature,sellerSignature2,buyerSignature2,
  witness1Signature2,witness2Signature3 }) => (

  <Document>
    <Page size="A4" style={styles.page}>
      {/* ***** 2. นำฟังก์ชัน addSoftHyphens ไปใช้กับข้อความต่างๆ ***** */}
      <Text style={styles.header}>{addSoftHyphens('สัญญาจะซื้อจะขาย หรือ สัญญาวางเงินมัดจำา')}</Text>

      {/* Date and Place */}
      <View style={{ ...styles.section, alignItems: 'flex-end' }}>
        <View style={{ width: '60%' }}>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens('สัญญานี้ทำที่:')}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.contractPlace)}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens('ในวันที่:')}</Text>
            <Text style={styles.input}>{`${data?.date || ''} ${data?.month || ''} ${data?.year || ''}`}</Text>
          </View>
        </View>
      </View>

      {/* Seller Section */}
      <View style={styles.section}>

        <View style={styles.flexRow}>
          <Text style={styles.label}>{addSoftHyphens('ระหว่าง')}</Text>
          <Text style={{ ...styles.input }}>{addSoftHyphens(data?.sellerName)}</Text>
          <Text>{addSoftHyphens('อายุ')}</Text>
          <Text style={{ ...styles.input, width: 40, flexGrow: 0 }}>{data?.sellerAge || ' '}</Text>
          <Text>{addSoftHyphens('ปี')}</Text>
        </View>

        <View style={styles.flexRow}>
          {/* จุดที่มีปัญหาบ่อย */}
          <Text>{addSoftHyphens('หมายเลขบัตรประจำตัวประชาชน')}</Text>
          <Text style={styles.input}>{addSoftHyphens(data?.sellerID)}</Text>
        </View>

        <View style={styles.flexRow}>
          <Text style={styles.label}>อยู่บ้านเลขที่</Text>
          <Text style={{ ...styles.input, flexGrow: 1.5 }}>{data?.sellerAddress || ' '}</Text>
          <Text style={styles.label}>หมู่ที่</Text>
          <Text style={{ ...styles.input, width: 40, flexGrow: 0 }}>{data?.sellerVillageNo || ' '}</Text>
          <Text style={styles.label}>ซอย</Text>
          <Text style={{ ...styles.input, flexGrow: 1 }}>{data?.sellerSoi || ' '}</Text>
          <Text style={styles.label}>ถนน</Text>
          <Text style={{ ...styles.input, flexGrow: 1 }}>{data?.sellerRoad || ' '}</Text>
        </View>

        <View style={styles.flexRow}>
          <Text>{addSoftHyphens("ตำบล/แขวง")}</Text>
          <Text style={styles.input}>{data?.sellerSubDistrict || ' '}</Text>
          <Text>{addSoftHyphens("อำเภอ/เขต")}</Text>
          <Text style={styles.input}>{data?.sellerDistrict || ' '}</Text>
          <Text style={styles.label}>จังหวัด</Text>
          <Text style={styles.input}>{data?.sellerProvince || ' '}</Text>
        </View>


        <Text>{addSoftHyphens('ซึ่งต่อไปในสัญญานี้จะเรียกว่า "')}<Text style={styles.bold}>{addSoftHyphens('ผู้จะขาย')}</Text>{addSoftHyphens('" ฝ่ายหนึ่ง')}</Text>
      </View>

      {/* Buyer Section */}
      <View style={styles.section}>
        <View style={styles.flexRow}>
          <Text>{addSoftHyphens('กับ')}</Text>
          <Text style={styles.input}>{addSoftHyphens(data?.buyerName)}</Text>
          <Text>{addSoftHyphens('อายุ')}</Text>
          <Text style={{ ...styles.input, width: 40, flexGrow: 0 }}>{data?.buyerAge || ' '}</Text>
          <Text>{addSoftHyphens('ปี')}</Text>
        </View>

        <View style={styles.flexRow}>
          <Text>{addSoftHyphens('หมายเลขบัตรประจำตัวประชาชน')}</Text>
          <Text style={styles.input}>{addSoftHyphens(data?.buyerID)}</Text>
        </View>

        <View style={styles.flexRow}>
          <Text style={styles.label}>อยู่บ้านเลขที่</Text>
          <Text style={{ ...styles.input, flexGrow: 1.5 }}>{data?.buyerAddress || ' '}</Text>
          <Text style={styles.label}>หมู่ที่</Text>
          <Text style={{ ...styles.input, width: 40, flexGrow: 0 }}>{data?.buyerVillageNo || ' '}</Text>
          <Text style={styles.label}>ซอย</Text>
          <Text style={{ ...styles.input, flexGrow: 1 }}>{data?.buyerSoi || ' '}</Text>
          <Text style={styles.label}>ถนน</Text>
          <Text style={{ ...styles.input, flexGrow: 1 }}>{data?.buyerRoad || ' '}</Text>
        </View>


        <View style={styles.flexRow}>
          <Text>{addSoftHyphens("ตำบล/แขวง")}</Text>
          <Text style={styles.input}>{data?.buyerSubDistrict || ' '}</Text>
          <Text>{addSoftHyphens("อำเภอ/เขต")}</Text>
          <Text style={styles.input}>{data?.buyerDistrict || ' '}</Text>
          <Text style={styles.label}>จังหวัด</Text>
          <Text style={styles.input}>{data?.buyerProvince || ' '}</Text>
        </View>

        <Text>{addSoftHyphens('ซึ่งต่อไปในสัญญานี้จะเรียกว่า "')}<Text style={styles.bold}>{addSoftHyphens('ผู้จะซื้อ')}</Text>{addSoftHyphens('" ฝ่ายหนึ่ง')}</Text>
      </View>

      {/* Clauses */}
      <View style={styles.section}>
        <Text style={styles.bold}>{addSoftHyphens('ทั้งสองฝ่ายตกลงทำสัญญาฉบับนี้ขึ้นด้วยความสมัครใจมีข้อความดังต่อไปนี้')}</Text>

        <View style={{ marginTop: 8 }}>
          {/* ประโยคยาวๆ ที่เป็นต้นเหตุของปัญหา */}
          <Text>{addSoftHyphens('ข้อ 1. ผู้ขายเป็นเจ้าของ')}</Text>
          <View style={styles.flexRow}>
            <Text style={styles.input}>{addSoftHyphens(data?.ownSeller)}</Text>
          </View>

          <Text>{addSoftHyphens('ข้อ 2. ผู้จะขายตกลงจะขายและผู้จะซื้อตกลงจะซื้อ ดังกล่าวในข้อ 1. โดยปลอดจากภาวะผูกพันหรือภาระติดพันใดๆ')}</Text>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens('ในราคา')}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.price)}</Text>
            <Text>{addSoftHyphens("บาท")}</Text>
            <Text>{addSoftHyphens("(")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.pricefont)}</Text>
            <Text>{addSoftHyphens(")")}</Text>
          </View>

          <View style={styles.flexRow}>
            <Text>{addSoftHyphens('ข้อ 3. ในวันทำสัญญาฉบับนี้ ผู้จะซื้อตกลงวางเงินมัดจำบางส่วนให้แก่ผู้จะขายเป็นจำนวนเงิน')}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.somecontract)}</Text>
            <Text>{addSoftHyphens("บาท")}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("(")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.pricefont3)}</Text>
            <Text>{addSoftHyphens(")")}</Text>
            <Text>{addSoftHyphens("โดยชำระเป็นเงินสด/เช็คธนาคาร")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.bankcheck)}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("สาขา")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.remainingAmount)}</Text>
            <Text>{addSoftHyphens("เลขที่เช็ค")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.checkNo)}</Text>
            <Text>{addSoftHyphens("สั่งจ่ายเงินวันที่")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.datepay)}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("โอนเงินเข้าบัญชี")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.toaccount)}</Text>
            <Text>{addSoftHyphens("ชื่อบัญชี")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.nameaccount1)}</Text>
            <Text>{addSoftHyphens("เลขที่บัญชี")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.accountNo)}</Text>
          </View>
          <Text>{addSoftHyphens('ซึ่งผู้ขายได้รับไว้เรียบร้อยถูกต้องครบถ้วนแล้ว และคู่สัญญา ได้ถือว่าเงินมัดจำดังกล่าวนี้เป็นเงินชำระราคาส่วนหนึ่ง')}</Text>

        </View>

        <View style={{ marginTop: 8 }}>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens('ข้อ 4: ผู้ซื้อตกลงชำระราคา ส่วนที่เหลืออีก')}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.moneyleft)}</Text>
            <Text>{addSoftHyphens("บาท")}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("(")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.pricefont4)}</Text>
            <Text>{addSoftHyphens(")")}</Text>
            <Text>{addSoftHyphens("ภายในวันที่")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.dateofpay5)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <Text>{addSoftHyphens('ข้อ 5: ค่าใช้จ่ายในการโอนกรรมสิทธิ์')}</Text>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens('5.1 ค่าธรรมเนียมการโอน (ผู้ออก)')}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.transferfee)}</Text>
            <Text>{addSoftHyphens("เป็นผู้ออก")}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens('5.2 ค่าธุรกิจเฉพาะ/อากร (ผู้ออก)')}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.specificbusinessfee)}</Text>
            <Text>{addSoftHyphens("เป็นผู้ออก")}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens('5.3 ค่าภาษีเงินได้บุคคลธรรมดา/ภาษีเงินได้นิติบุคคล/ภาษีเงินได้มรดก(รับให้)')}</Text>
          </View>

          <View style={styles.flexRow}>
            <Text style={styles.input}>{addSoftHyphens(data?.incomeTax)}</Text>
            {/* (ข้อสังเกต) แก้ไขจาก <span> เป็น <Text> เพราะ PDF Renderer ไม่รู้จัก HTML tag */}
            <Text>{addSoftHyphens('เป็นผู้ออก')}</Text>
          </View>
          <Text>{addSoftHyphens('5.4 ค่าจดจำนอง(ถ้ามี)ผู้ซื้อจะเป็นผู้ออก')}</Text>
          <View style={styles.flexRow}>
            {/* นี่คือประโยคที่ยาวที่สุดและมักจะมีปัญหา */}
            <Text>{addSoftHyphens('ข้อ 6. หากผู้จะซื้อผิดสัญญา ผู้จะซื้อยอมให้ผู้จะขายริบเงินที่ได้ชำระไว้แล้วทั้งสิ้น หากผู้จะขายผิดสัญญา ')}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("ผู้จะขายต้องคืนเงินที่ ได้ชำระไว้จากผู้จะซื้อทั้งหมด และยอมชดใช้ค่าเสียหายให้ผู้จะซื้อจำนวนเงิน")}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens('เท่ากับเงินที่ผู้จะซื้อได้วางมัดจำ สัญญานี้ทำขึ้นเป็นสามฉบับ แต่ละฉบับมีข้อความถูกต้องตรงกันทุกประการ')}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("ทั้งสองฝ่ายต่างได้อ่านและเข้าใจดี เห็นว่าตรงตาม ความประสงค์ของตนแล้ว ")}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน")}</Text>
          </View>
        </View>
      </View>

      {/* Signature Section (เหมือนเดิม) */}

      <View style={styles.signatureContainer}>
        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า sellerSignature มีค่า, ให้แสดง Image */}
            {sellerSignature && <Image src={sellerSignature} style={styles.signatureImage} />}
          </View>

          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("(")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.namesigseller)}</Text>
            <Text>{addSoftHyphens(")")}</Text>
          </View>

          <Text>(ผู้จะขาย)</Text>
        </View>

        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า buyerSignature มีค่า, ให้แสดง Image */}
            {buyerSignature && <Image src={buyerSignature} style={styles.signatureImage} />}
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("(")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.namesigbuyer)}</Text>
            <Text>{addSoftHyphens(")")}</Text>
          </View>
          <Text>(ผู้จะซื้อ)</Text>
        </View>

        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า buyerSignature มีค่า, ให้แสดง Image */}
            {witness1Signature && <Image src={witness1Signature} style={styles.signatureImage} />}
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("(")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.witness1)}</Text>
            <Text>{addSoftHyphens(")")}</Text>
          </View>
          <Text>(พยาน)</Text>
        </View>

        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า buyerSignature มีค่า, ให้แสดง Image */}
            {witness2Signature && <Image src={witness2Signature} style={styles.signatureImage} />}
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("(")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.witness2)}</Text>
            <Text>{addSoftHyphens(")")}</Text>
          </View>
          <Text>(พยาน)</Text>
        </View>

      </View>
    </Page>

    <Page size="A4" style={styles.page}>

      <Text style={styles.header}>{addSoftHyphens('บันทึกข้อตกลงสัญญาจะซื้อจะขาย')}</Text>
      <View style={styles.flexRow}>
        <Text>{addSoftHyphens("ผู้จะซื้อและผู้จะขายได้ตกลงกันว่าจะแจ้งซื้อขายกันที่กรมที่ดินในราคา")}</Text>
        <Text style={styles.input}>{addSoftHyphens(data?.notification_sale)}</Text>
        <Text>{addSoftHyphens("บาท")}</Text>
      </View>

      <View style={styles.flexRow}>
        <Text>{addSoftHyphens("(")}</Text>
        <Text style={styles.input}>{addSoftHyphens(data?.pricefont5)}</Text>
        <Text>{addSoftHyphens(")")}</Text>
        <Text>{addSoftHyphens("ในกรณีที่แจ้งซื้อขายกันเกินกว่าราคาที่ตกลงกันดังกล่าว")}</Text>
      </View>
      <View style={styles.flexRow}>
        <Text>{addSoftHyphens("ข้างต้น")}</Text>
        <Text style={styles.input}>{addSoftHyphens(data?.realprice)}</Text>
        <Text>{addSoftHyphens("จะต้องเป็นผู้รับผิดชอบในส่วนที่เกินทั้งหมด")}</Text>
      </View>
      <View style={styles.flexRow}>
        <Text>{addSoftHyphens("หมายเหตุ")}</Text>
        <Text style={styles.input}>{addSoftHyphens(data?.annotation)}</Text>
      </View>
      
      

         {/* Signature 2 */}
      <View style={styles.signatureContainer}>
        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า sellerSignature มีค่า, ให้แสดง Image */}
            {sellerSignature2 && <Image src={sellerSignature2} style={styles.signatureImage} />}
          </View>

          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("(")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.namesigseller2)}</Text>
            <Text>{addSoftHyphens(")")}</Text>
          </View>

          <Text>(ผู้จะขาย)</Text>
        </View>

        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า buyerSignature มีค่า, ให้แสดง Image */}
            {buyerSignature2 && <Image src={buyerSignature2} style={styles.signatureImage} />}
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("(")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.namesigbuyer2)}</Text>
            <Text>{addSoftHyphens(")")}</Text>
          </View>
          <Text>(ผู้จะซื้อ)</Text>
        </View>

        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า buyerSignature มีค่า, ให้แสดง Image */}
            {witness1Signature2 && <Image src={witness1Signature2} style={styles.signatureImage} />}
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("(")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.witness1sig2)}</Text>
            <Text>{addSoftHyphens(")")}</Text>
          </View>
          <Text>(พยาน)</Text>
        </View>

        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า buyerSignature มีค่า, ให้แสดง Image */}
            {witness2Signature3 && <Image src={witness2Signature3} style={styles.signatureImage} />}
          </View>
          <View style={styles.flexRow}>
            <Text>{addSoftHyphens("(")}</Text>
            <Text style={styles.input}>{addSoftHyphens(data?.witness2sig2)}</Text>
            <Text>{addSoftHyphens(")")}</Text>
          </View>
          <Text>(พยาน)</Text>
        </View>

      </View>


    </Page>
  </Document>
);

export default ContractDocument;