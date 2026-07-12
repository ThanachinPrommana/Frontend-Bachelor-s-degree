import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'; // <-- ให้เหลือ - ตัวเดียว


Font.register({
  family: 'Noto Sans Thai',
  fonts: [
    { src: '/fonts/NotoSansThai-Regular.ttf' }, // path to font file
    { src: '/fonts/NotoSansThai-Bold.ttf', fontWeight: 'bold' },
  ],
});
// สร้าง Stylesheet (เหมือนเดิม)
const formatThaiDate = (isoDate) => {
  if (!isoDate) return " "; // ถ้าไม่มีข้อมูล ให้คืนค่าว่าง

  try {
    const date = new Date(isoDate);

    // ถ้าวันที่ผิดพลาด
    if (isNaN(date.getTime())) {
      console.warn("Invalid date value passed to formatThaiDate:", isoDate);
      return " ";
    }

    const options = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      calendar: 'buddhist', // หัวใจสำคัญ
      timeZone: 'Asia/Bangkok'
    };

    // จะได้ผลลัพธ์เช่น "31 ตุลาคม 2568"
    return new Intl.DateTimeFormat('th-TH', options).format(date);

  } catch (error) {
    console.error("Error formatting date:", error);
    return " "; // คืนค่าว่างหากเกิด Error
  }
};

const styles = StyleSheet.create({
  // ... (style ทั้งหมดของคุณเหมือนเดิม)
  page: {
    fontFamily: 'Noto Sans Thai',
    padding: 50,
    fontSize: 11,
    lineHeight: 1.3,
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

// ใช้ฟังก์ชันนี้แทน
const wordBreak = (word) => {
  return word.split('');
};

// ***** 1. เพิ่มฟังก์ชัน Helper นี้เข้าไป *****
// const addSoftHyphens = (text) => {
//   if (!text || typeof text !== 'string') return ' ';
//   return text
//     // รวมพยัญชนะกับวรรณยุกต์เป็นหนึ่งกลุ่ม
//     .normalize('NFC')
//     // แล้วค่อยแทรก zero-width space
//     .split(/(?=[ก-ฮ])/).join('\u200B');
// };



const ContractDocument = ({ data, buyerSignature, sellerSignature, witness1Signature,
  witness2Signature, sellerSignature2, buyerSignature2,
  witness1Signature2, witness2Signature3 }) => (

  <Document>
    <Page size="A4" style={styles.page}>
      {/* ***** 2. นำฟังก์ชัน addSoftHyphens ไปใช้กับข้อความต่างๆ ***** */}
      <Text style={styles.header}>สัญญาจะซื้อจะขาย หรือ สัญญาวางเงินมัดจำา</Text>

      {/* Date and Place */}
      <View style={{ ...styles.section, alignItems: 'flex-end' }}>
        <View style={{ width: '60%' }}>
          <View style={styles.flexRow}>
            <Text>สัญญานี้ทำที่:</Text>
            <Text style={styles.input}>{data?.contractPlace || ""}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>ในวันที่:</Text>
            {/* ***** 2. แก้ไขบรรทัดนี้ ***** */}
            <Text style={styles.input}>{formatThaiDate(data?.contractDate)}</Text>
          </View>
        </View>
      </View>

      {/* Seller Section */}
      <View style={styles.section}>

        <View style={styles.flexRow}>
          <Text style={styles.label}>ระหว่าง</Text>
          <Text style={{ ...styles.input }}>{data?.sellerName || ""}</Text>
          <Text>อายุ</Text>
          <Text style={{ ...styles.input, width: 40, flexGrow: 0 }}>{data?.sellerAge || ' '}</Text>
          <Text>ปี</Text>
        </View>

        <View style={styles.flexRow}>
          {/* จุดที่มีปัญหาบ่อย */}
          <Text>หมายเลขบัตรประจำตัวประชาชนน</Text>
          <Text style={styles.input}>{data?.sellerID || ""}</Text>
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
          <Text>ตำบล/แขวงง</Text>
          <Text style={styles.input}>{data?.sellerSubDistrict || ' '}</Text>
          <Text>อำเภอ/เขตต</Text>
          <Text style={styles.input}>{data?.sellerDistrict || ' '}</Text>
          <Text style={styles.label}>จังหวัด</Text>
          <Text style={styles.input}>{data?.sellerProvince || ' '}</Text>
        </View>


        <Text>ซึ่งต่อไปในสัญญานี้จะเรียกว่า<Text style={styles.bold}>ผู้จะขาย</Text>ฝ่ายหนึ่ง</Text>
      </View>

      {/* Buyer Section */}
      <View style={styles.section}>
        <View style={styles.flexRow}>
          <Text>กับ</Text>
          <Text style={styles.input}>{data?.buyerName || ""}</Text>
          <Text>อายุ</Text>
          <Text style={{ ...styles.input, width: 40, flexGrow: 0 }}>{data?.buyerAge || ' '}</Text>
          <Text>ปี</Text>
        </View>

        <View style={styles.flexRow}>
          <Text>หมายเลขบัตรประจำตัวประชาชนน</Text>
          <Text style={styles.input}>{data?.buyerID || ""}</Text>
        </View>

        <View style={styles.flexRow}>
          <Text style={styles.label}>อยู่บ้านเลขที่</Text>
          <Text style={{ ...styles.input, flexGrow: 1.5 }}>{`${data?.buyerReg_HouseNo || ' '}\u200B`}</Text>
          <Text style={styles.label}>หมู่ที่</Text>
          <Text style={{ ...styles.input, width: 40, flexGrow: 0 }}>{`${data?.buyerReg_Village || ' '}\u200B`}</Text>
          <Text style={styles.label}>ซอย</Text>
          <Text style={{ ...styles.input, flexGrow: 1 }}>{`${data?.buyerReg_Alley || ' '}\u200B`}</Text>
          <Text style={styles.label}>ถนน</Text>
          <Text style={{ ...styles.input, flexGrow: 1 }}>{`${data?.buyerReg_Road || ' '}\u200B`}</Text>
        </View>


        <View style={styles.flexRow}>
          <Text>ตำบล/แขวงง</Text>
          <Text style={styles.input}>{`${data?.buyerReg_Subdistrict || ' '}\u200B`}</Text>
          <Text>อำเภอ/เขตต</Text>
          <Text style={styles.input}>{`${data?.buyerReg_District || ' '}\u200B`}</Text>
          <Text style={styles.label}>จังหวัด</Text>
          <Text style={styles.input}>{`${data?.buyerReg_Province || ' '}\u200B`}</Text>
        </View>

        <Text>ซึ่งต่อไปในสัญญานี้จะเรียกว่า<Text style={styles.bold}>ผู้จะซื้อ</Text>ฝ่ายหนึ่ง</Text>
      </View>

      {/* Clauses */}
      <View style={styles.section}>
        <Text style={styles.bold}>ทั้งสองฝ่ายตกลงทำสัญญาฉบับนี้ขึ้นด้วยความสมัครใจมีข้อความดังต่อไปนี้</Text>

        <View style={{ marginTop: 8 }}>
          {/* ประโยคยาวๆ ที่เป็นต้นเหตุของปัญหา */}
          <Text>ข้อ 1. ผู้ขายเป็นเจ้าของ</Text>
          <View style={styles.flexRow}>
            <Text style={styles.input}>{data?.ownSeller || ""}</Text>
          </View>

          <Text>ข้อ 2. ผู้จะขายตกลงจะขายและผู้จะซื้อตกลงจะซื้อ ดังกล่าวในข้อ 1. โดยปลอดจากภาวะผูกพันหรือภาระติดพันใดๆ</Text>
          <View style={styles.flexRow}>
            <Text>ในราคา</Text>
            <Text style={styles.input}>{data?.price || ""}</Text>
            <Text>บาท</Text>
            <Text>(</Text>
            <Text style={styles.input}>{data?.pricefont || ""}</Text>
            <Text>)</Text>
          </View>

          <View style={styles.flexRow}>
            <Text>ข้อ 3. ในวันทำสัญญาฉบับนี้ ผู้จะซื้อตกลงวางเงินมัดจำบางส่วนให้แก่ผู้จะขายเป็นจำนวนเงินงิน</Text>
            <Text style={styles.input}>{data?.somecontract || ""}</Text>
            <Text>บาท</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>(</Text>
            <Text style={styles.input}>{data?.pricefont3 || ""}</Text>
            <Text>)</Text>
            <Text>โดยชำระเป็นเงินสด/เช็คธนาคารร</Text>
            <Text style={styles.input}>{data?.bankcheck || ""}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>สาขา</Text>
            <Text style={styles.input}>{data?.remainingAmount || ""}</Text>
            <Text>เลขที่เช็ค</Text>
            <Text style={styles.input}>{data?.checkNo || ""}</Text>

            <Text>ในวันที่:</Text>
            {/* ***** 2. แก้ไขบรรทัดนี้ ***** */}
            <Text style={styles.input}>{formatThaiDate(data?.datepay)}</Text>

          </View>
          <View style={styles.flexRow}>
            <Text>โอนเงินเข้าบัญชี</Text>
            <Text style={styles.input}>{data?.toaccount || ""}</Text>
            <Text>ชื่อบัญชี</Text>
            <Text style={styles.input}>{data?.nameaccount1 || ""}</Text>
            <Text>เลขที่บัญชี</Text>
            <Text style={styles.input}>{data?.accountNo || ""}</Text>
          </View>
          <Text>ซึ่งผู้ขายได้รับไว้เรียบร้อยถูกต้องครบถ้วนแล้ว และคู่สัญญา ได้ถือว่าเงินมัดจำดังกล่าวนี้เป็นเงินชำระราคาส่วนหนึ่งงง</Text>

        </View>

        <View style={{ marginTop: 8 }}>
          <View style={styles.flexRow}>
            <Text>ข้อ 4: ผู้ซื้อตกลงชำระราคา ส่วนที่เหลืออีกก</Text>
            <Text style={styles.input}>{data?.moneyleft || ""}</Text>
            <Text>บาท</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>(</Text>
            <Text style={styles.input}>{data?.pricefont4 || ""}</Text>
            <Text>)</Text>
            <Text>ภายในวันที่</Text>
            <Text style={styles.input}>{formatThaiDate(data?.dateofpay5)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <Text>ข้อ 5: ค่าใช้จ่ายในการโอนกรรมสิทธิ์</Text>
          <View style={styles.flexRow}>
            <Text>5.1 ค่าธรรมเนียมการโอน (ผู้ออก)</Text>
            <Text style={styles.input}>{data?.transferfee || ""}</Text>
            <Text>เป็นผู้ออก</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>5.2 ค่าธุรกิจเฉพาะ/อากร (ผู้ออก)</Text>
            <Text style={styles.input}>{data?.specificbusinessfee || ""}</Text>
            <Text>เป็นผู้ออก</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>5.3 ค่าภาษีเงินได้บุคคลธรรมดา/ภาษีเงินได้นิติบุคคล/ภาษีเงินได้มรดก(รับให้)</Text>
          </View>

          <View style={styles.flexRow}>
            <Text style={styles.input}>{data?.incomeTax || ""}</Text>
            {/* (ข้อสังเกต) แก้ไขจาก <span> เป็น <Text> เพราะ PDF Renderer ไม่รู้จัก HTML tag */}
            <Text>เป็นผู้ออก</Text>
          </View>
          <Text>5.4 ค่าจดจำนอง(ถ้ามี)ผู้ซื้อจะเป็นผู้ออกก</Text>
          <View style={styles.flexRow}>
            {/* นี่คือประโยคที่ยาวที่สุดและมักจะมีปัญหา */}
            <Text>ข้อ 6. หากผู้จะซื้อผิดสัญญา ผู้จะซื้อยอมให้ผู้จะขายริบเงินที่ได้ชำระไว้แล้วทั้งสิ้น หากผู้จะขายผิดสัญญาา</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>ผู้จะขายต้องคืนเงินที่ ได้ชำระไว้จากผู้จะซื้อทั้งหมด และยอมชดใช้ค่าเสียหายให้ผู้จะซื้อจำนวนเงินนน</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>เท่ากับเงินที่ผู้จะซื้อได้วางมัดจำ สัญญานี้ทำขึ้นเป็นสามฉบับ แต่ละฉบับมีข้อความถูกต้องตรงกันทุกประการาร</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>ทั้งสองฝ่ายต่างได้อ่านและเข้าใจดี เห็นว่าตรงตาม ความประสงค์ของตนแล้ว</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยานน</Text>
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
            <Text>(</Text>
            <Text style={styles.input}>{data?.namesigseller || ""}</Text>
            <Text>)</Text>
          </View>

          <Text>(ผู้จะขาย)</Text>
        </View>

        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า buyerSignature มีค่า, ให้แสดง Image */}
            {buyerSignature && <Image src={buyerSignature} style={styles.signatureImage} />}
          </View>
          <View style={styles.flexRow}>
            <Text>(</Text>
            <Text style={styles.input}>{data?.namesigbuyer || ""}</Text>
            <Text>)</Text>
          </View>
          <Text>(ผู้จะซื้อ)</Text>
        </View>

        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า buyerSignature มีค่า, ให้แสดง Image */}
            {witness1Signature && <Image src={witness1Signature} style={styles.signatureImage} />}
          </View>
          <View style={styles.flexRow}>
            <Text>(</Text>
            <Text style={styles.input}>{data?.witness1 || ""}</Text>
            <Text>)</Text>
          </View>
          <Text>(พยาน)</Text>
        </View>

        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า buyerSignature มีค่า, ให้แสดง Image */}
            {witness2Signature && <Image src={witness2Signature} style={styles.signatureImage} />}
          </View>
          <View style={styles.flexRow}>
            <Text>(</Text>
            <Text style={styles.input}>{data?.witness2 || ""}</Text>
            <Text>)</Text>
          </View>
          <Text>(พยาน)</Text>
        </View>

      </View>
    </Page>

    <Page size="A4" style={styles.page}>

      <Text style={styles.header}>บันทึกข้อตกลงสัญญาจะซื้อจะขาย</Text>
      <View style={styles.flexRow}>
        <Text>ผู้จะซื้อและผู้จะขายได้ตกลงกันว่าจะแจ้งซื้อขายกันที่กรมที่ดินในราคา</Text>
        <Text style={styles.input}>{data?.notification_sale || ""}</Text>
        <Text>บาท</Text>
      </View>

      <View style={styles.flexRow}>
        <Text>(</Text>
        <Text style={styles.input}>{data?.pricefont5 || ""}</Text>
        <Text>)</Text>
        <Text>ในกรณีที่แจ้งซื้อขายกันเกินกว่าราคาที่ตกลงกันดังกล่าว</Text>
      </View>
      <View style={styles.flexRow}>
        <Text>ข้างต้น</Text>
        <Text style={styles.input}>{data?.realprice || ""}</Text>
        <Text>จะต้องเป็นผู้รับผิดชอบในส่วนที่เกินทั้งหมด</Text>
      </View>
      <View style={styles.flexRow}>
        <Text>หมายเหตุ</Text>
        <Text style={styles.input}>{data?.annotation || ""}</Text>
      </View>



      {/* Signature 2 */}
      <View style={styles.signatureContainer}>
        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า sellerSignature มีค่า, ให้แสดง Image */}
            {sellerSignature2 && <Image src={sellerSignature2} style={styles.signatureImage} />}
          </View>

          <View style={styles.flexRow}>
            <Text>(</Text>
            <Text style={styles.input}>{data?.namesigseller2 || ""}</Text>
            <Text>)</Text>
          </View>

          <Text>(ผู้จะขาย)</Text>
        </View>

        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า buyerSignature มีค่า, ให้แสดง Image */}
            {buyerSignature2 && <Image src={buyerSignature2} style={styles.signatureImage} />}
          </View>
          <View style={styles.flexRow}>
            <Text>(</Text>
            <Text style={styles.input}>{data?.namesigbuyer2 || ""}</Text>
            <Text>)</Text>
          </View>
          <Text>(ผู้จะซื้อ)</Text>
        </View>

        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า buyerSignature มีค่า, ให้แสดง Image */}
            {witness1Signature2 && <Image src={witness1Signature2} style={styles.signatureImage} />}
          </View>
          <View style={styles.flexRow}>
            <Text>(</Text>
            <Text style={styles.input}>{data?.witness1sig2 || ""}</Text>
            <Text>)</Text>
          </View>
          <Text>(พยาน)</Text>
        </View>

        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {/* ถ้า buyerSignature มีค่า, ให้แสดง Image */}
            {witness2Signature3 && <Image src={witness2Signature3} style={styles.signatureImage} />}
          </View>
          <View style={styles.flexRow}>
            <Text>(</Text>
            <Text style={styles.input}>{data?.witness2sig2 || ""}</Text>
            <Text>)</Text>
          </View>
          <Text>(พยาน)</Text>
        </View>

      </View>


    </Page>
  </Document>
);

export default ContractDocument;