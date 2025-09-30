import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// (สำคัญ) ลงทะเบียน Font ภาษาไทย
Font.register({
  family: 'Sarabun',
  fonts: [
    { src: '/fonts/Sarabun-Regular.ttf' },
    { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' },
  ]
});

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
  input: {
    borderBottom: '1px dotted black',
    flexGrow: 1,
    marginLeft: 5,
    marginRight: 5,
    paddingBottom: 2,
    minHeight: 12,
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
  }
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
              <Text>ระหว่าง</Text>
              <Text style={styles.input}>{data?.sellerName || ' '}</Text>
              <Text>อายุ</Text>
              <Text style={{...styles.input, width: 40, flexGrow: 0}}>{data?.sellerAge || ' '}</Text>
              <Text>ปี</Text>
          </View>
          <View style={styles.flexRow}>
              <Text>หมายเลขบัตรประจำตัวประชาชน</Text>
              <Text style={styles.input}>{data?.sellerID || ' '}</Text>
          </View>
          <View style={styles.flexRow}>
              <Text>อยู่บ้านเลขที่</Text>
              <Text style={styles.input}>{data?.sellerAddress || ' '}</Text>
              <Text>หมู่ที่</Text>
              <Text style={{...styles.input, width: 40, flexGrow: 0}}>{data?.sellerVillageNo || ' '}</Text>
              <Text>ซอย</Text>
              <Text style={styles.input}>{data?.sellerSoi || ' '}</Text>
          </View>
          <View style={styles.flexRow}>
              <Text>ถนน</Text>
              <Text style={styles.input}>{data?.sellerRoad || ' '}</Text>
              <Text>ตำบล/แขวง</Text>
              <Text style={styles.input}>{data?.sellerSubDistrict || ' '}</Text>
          </View>
          <View style={styles.flexRow}>
              <Text>อำเภอ/เขต</Text>
              <Text style={styles.input}>{data?.sellerDistrict || ' '}</Text>
              <Text>จังหวัด</Text>
              <Text style={styles.input}>{data?.sellerProvince || ' '}</Text>
          </View>
          <Text>ซึ่งต่อไปในสัญญานี้จะเรียกว่า "<Text style={styles.bold}>ผู้จะขาย</Text>" ฝ่ายหนึ่ง</Text>
      </View>

       <View style={styles.section}>
          <View style={styles.flexRow}>
              <Text>กับ</Text>
              <Text style={styles.input}>{data?.buyerName || ' '}</Text>
              <Text>อายุ</Text>
              <Text style={{...styles.input, width: 40, flexGrow: 0}}>{data?.buyerAge || ' '}</Text>
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
              <Text style={{...styles.input, width: 40, flexGrow: 0}}>{data?.buyerVillageNo || ' '}</Text>
          </View>
          <Text>ซึ่งต่อไปในสัญญานี้จะเรียกว่า "<Text style={styles.bold}>ผู้จะซื้อ</Text>" อีกฝ่ายหนึ่ง</Text>
       </View>
      
      {/* Clause 1 */}
      <View style={styles.section}>
        <Text style={styles.bold}>ข้อ 1. ทรัพย์สินที่ซื้อขาย</Text>
        <View style={styles.flexRow}>
            <Text>ผู้จะขายตกลงขายและผู้จะซื้อตกลงรับซื้อ</Text>
            <Text style={styles.input}>{data?.propertyType || ' '}</Text>
        </View>
        <View style={styles.flexRow}>
            <Text>ตามโฉนดที่ดินเลขที่</Text>
            <Text style={styles.input}>{data?.deedNumber || ' '}</Text>
            <Text>เนื้อที่ประมาณ</Text>
            <Text style={styles.input}>{data?.area || ' '}</Text>
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