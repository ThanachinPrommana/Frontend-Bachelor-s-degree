return (
  <div className="p-4 md:p-6 max-w-5xl mx-auto">
    <h2 className="text-2xl font-bold mb-4">เอกสาร/การจอง สำหรับตรวจสอบ</h2>

    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <input
        type="text"
        placeholder="ค้นหาจากชื่อผู้ซื้อ หรือชื่อโครงการ..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-4 py-2"
      />
      <select
        value={activeTab}
        onChange={(e) => setActiveTab(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 md:w-auto w-full"
      >
        <option value="ALL">ทั้งหมด</option>
        <option value="PENDING">รอตรวจสอบเอกสาร</option>
        <option value="PENDING_FINAL_VERIFICATION">รอตรวจสอบสลิปสุดท้าย</option>
        <option value="APPROVED">อนุมัติแล้ว</option>
        <option value="REJECTED">ถูกปฏิเสธ</option>
      </select>
    </div>

    <div className="bg-gray-100 p-4 rounded-lg max-h-[70vh] overflow-y-auto space-y-4">
      {loading ? (
        <div className="text-center p-10"><Loader2 className="w-8 h-8 mx-auto animate-spin" /></div>
      ) : groupedApplications.length === 0 ? (
        <div className="text-center text-gray-500 py-10"><p>ไม่พบรายการในหมวดหมู่นี้</p></div>
      ) : (
        groupedApplications.map((app) => {
          const isMyOwnDocument = authUser.id === app.buyerUserId;
          const isReadyForPayment = isMyOwnDocument && app.groupStatus === 'APPROVED' && !app.depositStatus;

          const cardClassName = `bg-white p-4 rounded-lg shadow-sm border flex flex-col gap-4 relative ${isReadyForPayment ? 'cursor-pointer hover:border-blue-500 hover:shadow-md transition-all' : ''
            }`;

          const handleCardClick = isReadyForPayment
            ? () => navigate('/buyer/deposit-payment', { state: { documentData: app.documents[0] } })
            : undefined;

          // ถ้าเป็นสถานะรอตรวจสอบสลิป ให้แสดง FinalSlipCard เท่านั้น
          if (app.groupStatus === 'PENDING_FINAL_VERIFICATION') {
            return (
              <div key={app.unitId} className="bg-white rounded-lg shadow-sm border">
                <FinalSlipCard
                  booking={app}
                  onConfirm={handleConfirmFinalSlip}
                  isConfirming={confirmingId === app.bookingId}
                />
              </div>
            )
          }

          // สำหรับสถานะอื่นๆ ให้แสดง Card แบบเดิม
          return (
            <div key={app.unitId} className={cardClassName} onClick={handleCardClick}>
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div className="flex-grow">
                  <h3 className="font-bold text-gray-800 text-lg">โครงการ: {app.propertyName}</h3>
                  <p className="text-sm text-gray-500 mt-1">ยูนิต: <span className="font-semibold text-gray-700">{app.unitNumber}</span></p>
                  <p className="text-sm text-gray-500 mt-0.5">ผู้ส่ง: <span className="font-semibold text-gray-700">{app.buyerName}</span> | ส่งเมื่อ: {new Date(app.createdAt).toLocaleDateString('th-TH')}</p>
                </div>
                <StatusBadge status={app.groupStatus} />
              </div>

              {app.documents.length > 0 && (
                <div className="border-t pt-4 mt-2">
                  <p className="font-semibold text-gray-700 mb-2">เอกสารที่แนบมา ({app.documents.length} ฉบับ):</p>
                  <ul className="list-none pl-0 space-y-2">
                    {app.documents.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-4 py-1 px-2">
                        <a href={doc.DocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                          <FileText size={16} />
                          <span className="truncate">{doc.DocumentName || 'เอกสารไม่ระบุชื่อ'}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 border-t pt-4">
                {app.groupStatus === 'PENDING' && !isMyOwnDocument && (
                  <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={() => handleReview(app, 'REJECTED')} disabled={reviewingId === app.unitId} className="border-red-500 text-red-500 hover:bg-red-50">
                      {reviewingId === app.unitId ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      <span className="ml-2">ปฏิเสธ</span>
                    </Button>
                    <Button onClick={() => handleReview(app, 'APPROVED')} disabled={reviewingId === app.unitId} className="bg-green-600 hover:bg-green-700 text-white">
                      {reviewingId === app.unitId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span className="ml-2">อนุมัติ</span>
                    </Button>
                  </div>
                )}
                {app.groupStatus === 'APPROVED' && (
                  isMyOwnDocument ? (
                    <>
                      {app.depositStatus !== 'CONFIRMED' && <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">ชำระเงินมัดจำ</Button>}
                      {app.depositStatus === 'CONFIRMED' && !app.bookingStatus && <Button onClick={() => navigate(`/booking/${app.documents[0].postId}/${app.unitId}`)} className="w-full bg-green-600 hover:bg-green-700 text-white">นัดวันเจรจา</Button>}
                      {app.bookingStatus && <div className="text-center text-sm text-gray-700 font-semibold p-2.5 bg-gray-100 rounded-md">✅ ดำเนินการเสร็จสิ้น</div>}

                    </>
                  ) : (
                    <>
                      {app.bookingStatus === 'PENDING_FINAL_VERIFICATION' ? (
                        <FinalSlipCard
                          booking={app}
                          onConfirm={handleConfirmFinalSlip}
                          isConfirming={confirmingId === app.bookingId}
                        />
                      ) : (
                        <>
                          {app.depositStatus !== 'CONFIRMED' && <p className="text-center text-sm text-blue-600 font-semibold">รอผู้ซื้อชำระเงินมัดจำ...</p>}
                          {app.depositStatus === 'CONFIRMED' && !app.bookingStatus && <p className="text-center text-sm text-green-600 font-semibold">ผู้ซื้อชำระเงินแล้ว, รอนัดวันเจรจา...</p>}
                          {app.bookingStatus && <div className="text-center text-sm text-gray-700 font-semibold p-2.5 bg-gray-100 rounded-md">✅ ผู้ซื้อดำเนินการเรียบร้อย</div>}
                        </>
                      )}
                    </>
                  )
                )}
                {app.groupStatus === 'REJECTED' && <p className="text-center text-sm text-red-600">เอกสารถูกปฏิเสธ</p>}
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);