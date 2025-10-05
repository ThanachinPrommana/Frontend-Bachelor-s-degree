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