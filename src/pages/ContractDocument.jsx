import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// (สำคัญ) ลงทะเบียน Font ภาษาไทย


// สร้าง Stylesheet คล้ายๆ CSS
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Sarabun',
    padding: 50,
    fontSize: 11,
    lineHeight: 1.6,
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
  label: { // (เพิ่ม) สร้าง style สำหรับ Label
    marginRight: 8, // เพิ่มระยะห่างด้านขวา 8px
    paddingBottom: 2,
    flexShrink: 0, // (สำคัญ) ทำให้ระดับเส้นตรงกับ input
  },
  input: {
    borderBottom: '1px dotted black',
    paddingBottom: 2,
    minHeight: 12,
    flexGrow: 1, // (สำคัญ) ทำให้ input ยืดหยุ่นเต็มที่ในบรรทัด
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
    marginTop: 80,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureColumn: {
    textAlign: 'center',
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


const ContractDocument = ({ data, buyerSignature, sellerSignature }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>สัญญาจะซื้อจะขาย หรือ สัญญาวางเงินมัดจำ</Text>

      {/* Date and Place */}
      <View style={{ ...styles.section, alignItems: 'flex-end' }}>
        <View style={{ width: '60%' }}>
          <View style={styles.flexRow}>
            <Text>สัญญานี้ทำที่:</Text>
            <Text style={styles.input}>{data?.contractPlace || ' '}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>ในวันที่:</Text>
            <Text style={styles.input}>{`${data?.date || ''} ${data?.month || ''} ${data?.year || ''}`}</Text>
          </View>
        </View>
      </View>

      {/* Parties */}
      <View style={styles.section}>
        <View style={styles.flexRow}>
          <Text style={styles.label}>ระหว่าง</Text>
          <Text style={{ ...styles.input }}>{data?.sellerName || ' '}</Text>
          <Text>อายุ</Text>
          <Text style={{ ...styles.input, width: 40, flexGrow: 0 }}>{data?.sellerAge || ' '}</Text>
          <Text>ปี</Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text>หมายเลขบัตรประจำตัวประชาชน</Text>
          {/* (แก้ไข) ใช้ style ใหม่ที่ไม่มี flexGrow */}
          <Text style={styles.inputFullWidth}>{data?.buyerID || ' '}</Text>
        </View>
        <View style={styles.flexRow}>
          <Text>อยู่บ้านเลขที่</Text>
          <Text style={{ ...styles.input, flexGrow: 3 }}>{data?.sellerAddress || ' '}</Text>
          <Text>หมู่ที่</Text>
          <Text style={{ ...styles.input, width: 60, flexGrow: 0 }}>{data?.sellerVillageNo || ' '}</Text>
        </View>
        <View style={styles.flexRow}>
          <Text>ซอย</Text>
          <Text style={styles.input}>{data?.sellerSoi || ' '}</Text>
          <Text>ถนน</Text>
          <Text style={styles.input}>{data?.sellerRoad || ' '}</Text>
        </View>
        <View style={styles.flexRow}>
          <Text style={styles.label}> ตำบล/แขวง</Text>
          <Text style={styles.input}>{data?.sellerSubDistrict || ' '}</Text>
          <Text>อำเภอ/เขต</Text>
          <Text style={styles.input}>{data?.sellerDistrict || ' '}</Text>
        </View>
        <View style={styles.flexRow}>
          <Text style={styles.label}>จังหวัด</Text>
          <Text style={styles.input}>{data?.sellerProvince || ' '}</Text>
        </View>
        <Text>ซึ่งต่อไปในสัญญานี้จะเรียกว่า "<Text style={styles.bold}>ผู้จะขาย</Text>" ฝ่ายหนึ่ง</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.flexRow}>
          <Text>กับ</Text>
          <Text style={styles.input}>{data?.buyerName || ' '}</Text>
          <Text>อายุ</Text>
          <Text style={{ ...styles.input, width: 40, flexGrow: 0 }}>{data?.buyerAge || ' '}</Text>
          <Text>ปี</Text>
        </View>
        <View style={styles.flexRow}>
          <Text>หมายเลขบัตรประจำตัวประชาชน</Text>
          <Text style={styles.input}>{data?.buyerID || ' '}</Text>
        </View>
        <View style={styles.flexRow}>
          <Text>อยู่บ้านเลขที่</Text>
          <Text style={styles.input}>{data?.buyerAddress || ' '}</Text>
          <Text>หมู่ที่</Text>
          <Text style={{ ...styles.input, width: 40, flexGrow: 0 }}>{data?.buyerVillageNo || ' '}</Text>
        </View>
        <View style={styles.flexRow}>
          <Text>ซอย</Text>
          <Text style={styles.input}>{data?.buyerSoi || ' '}</Text>
          <Text>ถนน</Text>
          <Text style={styles.input}>{data?.buyerRoad || ' '}</Text>
        </View>
        <View style={styles.flexRow}>
          <Text>ตำบล/แขวง</Text>
          <Text style={styles.input}>{data?.buyerSubDistrict || ' '}</Text>
          <Text>อำเภอ/เขต</Text>
          <Text style={styles.input}>{data?.buyerDistrict || ' '}</Text>
        </View>
        <View style={styles.flexRow}>
          <Text>จังหวัด</Text>
          <Text style={styles.input}>{data?.buyerProvince || ' '}</Text>
        </View>
        <Text>ซึ่งต่อไปในสัญญานี้จะเรียกว่า "<Text style={styles.bold}>ผู้จะซื้อ</Text>" ฝ่ายหนึ่ง</Text>
      </View>

      {/* Clause 1 */}
      <View style={styles.section}>
        <Text style={styles.bold}>ทั้งสองฝ่ายตกลงทำสัญญาฉบับนี้ขึ้นด้วยความสมัครใจมีข้อความดังต่อไปนี้</Text>

        {/* Clause 1 */}
        <View style={styles.flexRow}>
          <Text>ข้อ 1. ผู้ขายเป็นเจ้าของ</Text>
          <Text style={styles.input}>{data?.ownSeller || ' '}</Text>
        </View>

        {/* Clause 2 */}
        <View>
          <Text>ข้อ 2. ผู้ขายตกลงจะขายและผู้ซื้อตกลงจะซื้อ ในข้อ 1. โดยปลอกจากภาวะผูกพันหรือภาระติดพันใดๆ ในราคา</Text>
          <View style={styles.flexRow}>
            <Text style={styles.input}>{data?.price || ' '}</Text>
            <Text>บาท</Text>
          </View>
          <View style={styles.flexRow}>
            <Text style={styles.input}>{data?.responsibility || ' '}</Text>
          </View>
        </View>

        {/* Clause 3 */}
        <View style={{ marginTop: 8 }}>
          <Text>ข้อ 3. ในวันทำสัญญาฉบับนี้ ผู้จะซื้อตกลงวางเงินมัดจำบางส่วนให้แก่ผู้จะขายเป็นจำนวนเงิน</Text>
          <View style={styles.flexRow}>
            <Text style={styles.input}>{data?.somecontract || ' '}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>โดยชำระเป็นเงินสด/เช็กธนาคาร</Text>
            <Text style={styles.input}>{data?.bankcheck || ' '}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>สาขา</Text>
            <Text style={styles.input}>{data?.branch || ' '}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>เลขที่เช็ค</Text>
            <Text style={styles.input}>{data?.checkNo || ' '}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>สั่งจ่ายเงินวันที่</Text>
            <Text style={styles.input}>{data?.datepay || ' '}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>โอนเงินเข้าบัญชี</Text>
            <Text style={styles.input}>{data?.accountTo || ' '}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>ชื่อบัญชี</Text>
            <Text style={styles.input}>{data?.accountName || ' '}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>เลขที่บัญชี</Text>
            <Text style={styles.input}>{data?.accountNo || ' '}</Text>
          </View>
          <Text>ซึ่งผู้ขายได้รับไว้เรียบร้อยถูกต้องครบถ้วนแล้ว และคู่สัญญา ได้ถือว่าเงินมัดจำดังกล่าวนี้เป็นเงินชำระราคาส่วนหนึ่ง</Text>

        </View>
        <View style={{ marginTop: 8 }}>
          <View style={styles.flexRow}>
            <Text>ข้อ 4. ผู้ซื้อตกลงชำระราคา ส่วนที่เหลืออีก</Text>
            <Text style={styles.input}>{data?.pricecontractrest || ' '}</Text>
            <Text>บาท</Text>
          </View>
          <View style={styles.flexRow}>
            <Text style={styles.input}>{data?.Other || ' '}</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>ภายในวันที่</Text>
            <Text style={styles.input}>{data?.dateofpay4 || ' '}</Text>
          </View>
          <Text>ข้อ 5. ค่าใช้จ่ายในการโอนกรรมสิทธิ์</Text>
          <View style={styles.flexRow}>
            <Text>5.1 ค่าธรรมเนียมการโอน</Text>
            <Text style={styles.input}>{data?.transferfee || ' '}</Text>
            <Text>เป็นผู้ออก</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>5.2 ค่าธุรกิจเฉพาะ/อากร</Text>
            <Text style={styles.input}>{data?.specificbusinessfee || ' '}</Text>
            <Text>เป็นผู้ออก</Text>
          </View>
          <View style={styles.flexRow}>
            <Text>5.3 ค่าภาษีเงินได้บุคคลธรรมดา/ภาษีเงินได้นิติบุคคล/ภาษีเงินได้มรดก(รับให้)</Text>

          </View>
          <View style={styles.flexRow}>
            <Text style={styles.input}>{data?.incomeTax || ' '}</Text>
            <span>เป็นผู้ออก</span>
          </View>


          <Text>5.4 ค่าจดจำนอง(ถ้ามี)ผู้ซื้อจะเป็นผู้ออก</Text>

          <View style={styles.flexRow}>
            <Text>ข้อ 6. หากผู้จะซื้อผิดสัญญา ผู้จะซื้อยอมให้ผู้จะขายริบเงินที่ได้ชำระไว้แล้วทั้งสิ้น หากผู้จะขายผิดสัญญา ผู้จะขายต้องคืนเงินที่ได้ชำระไว้จากผู้จะซื้อทั้งหมด และยอมชดใช้ค่าเสียหายให้ผู้จะซื้อจำนวนเงินเท่ากับเงินที่ผู้จะซื้อได้วางมัดจำ
            </Text>
          </View>
          <View style={styles.flexRow}>
            <Text>สัญญานี้ทำขึ้นเป็นสามฉบับ แต่ละฉบับมีข้อความถูกต้องตรงกันทุกประการ ทั้งสองฝ่ายต่างได้อ่านและเข้าใจดี เห็นว่าตรงตามความประสงค์ของตนแล้ว จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน
            </Text>
          </View>

        </View>

      </View>

      {/* Signature Section */}
      <View style={styles.signatureContainer}>
        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {sellerSignature && <Image src={sellerSignature} style={styles.signatureImage} />}
          </View>
          <Text>(..................................................)</Text>
          <Text>(ผู้จะขาย)</Text>
        </View>
        <View style={styles.signatureColumn}>
          <View style={styles.signatureBox}>
            {buyerSignature && <Image src={buyerSignature} style={styles.signatureImage} />}
          </View>
          <Text>(..................................................)</Text>
          <Text>(ผู้จะซื้อ)</Text>
        </View>
      </View>

    </Page>
  </Document>
);

export default ContractDocument;