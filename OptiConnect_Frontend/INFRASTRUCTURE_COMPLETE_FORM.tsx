// This is the COMPLETE Infrastructure Form with ALL fields
// Replace the simplified form in InfrastructureManagementTool.tsx (lines 681-838)
// with this comprehensive version

{showAddForm && (
  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md space-y-4 max-h-[70vh] overflow-y-auto">
    <h4 className="font-medium text-gray-900 dark:text-white mb-2 sticky top-0 bg-gray-50 dark:bg-gray-900 pb-2">
      Add New Infrastructure - Complete Form
    </h4>

    {/* === SECTION 1: Basic Information === */}
    <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Basic Information</h5>

      {/* Type */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as InfrastructureType })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="POP">POP</option>
            <option value="SubPOP">SubPOP</option>
            <option value="Tower">Tower</option>
            <option value="Building">Building</option>
            <option value="Equipment">Equipment</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status *
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Planned">Planned</option>
            <option value="RFS">RFS</option>
            <option value="Damaged">Damaged</option>
          </select>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Infrastructure Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
          placeholder="e.g., Mumbai Central POP"
        />
      </div>
    </div>

    {/* === SECTION 2: Location === */}
    <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location *</h5>

      {/* Map Click Button */}
      <button
        onClick={() => setIsPlacingMarker(!isPlacingMarker)}
        type="button"
        className={`w-full px-3 py-2 text-sm font-medium rounded-md ${
          isPlacingMarker
            ? "bg-blue-600 text-white"
            : "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
        }`}
      >
        {isPlacingMarker ? "✓ Click Map to Set Location" : "📍 Click to Place on Map"}
      </button>

      {/* OR Divider */}
      <div className="flex items-center">
        <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
        <span className="px-2 text-xs text-gray-500 dark:text-gray-400">OR</span>
        <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
      </div>

      {/* Manual Coordinates */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          step="any"
          placeholder="Latitude *"
          value={manualLat}
          onChange={(e) => setManualLat(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 dark:text-white"
        />
        <input
          type="number"
          step="any"
          placeholder="Longitude *"
          value={manualLng}
          onChange={(e) => setManualLng(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 dark:text-white"
        />
      </div>
      <button
        onClick={handleManualCoordinates}
        type="button"
        disabled={!manualLat || !manualLng}
        className="w-full px-3 py-2 text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/30 disabled:opacity-50"
      >
        Set Coordinates
      </button>

      {/* Current Location Display */}
      {newInfraLocation && (
        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-400 font-mono">
          ✓ {newInfraLocation.lat.toFixed(6)}, {newInfraLocation.lng.toFixed(6)}
        </div>
      )}

      {/* Height */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Height (meters)
        </label>
        <input
          type="number"
          step="any"
          value={formData.height || ''}
          onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
          placeholder="e.g., 45"
        />
      </div>
    </div>

    {/* === SECTION 3: Address === */}
    <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Address</h5>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Street Address
        </label>
        <input
          type="text"
          value={formData.address?.street || ''}
          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } as any })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
          placeholder="Building, Street"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            City
          </label>
          <input
            type="text"
            value={formData.address?.city || ''}
            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
            placeholder="City"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            State
          </label>
          <input
            type="text"
            value={formData.address?.state || ''}
            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
            placeholder="State"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Pincode
        </label>
        <input
          type="text"
          value={formData.address?.pincode || ''}
          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } as any })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
          placeholder="Pincode"
        />
      </div>
    </div>

    {/* === SECTION 4: Contact Information === */}
    <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Information</h5>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Contact Person Name
        </label>
        <input
          type="text"
          value={formData.contactName || ''}
          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
          placeholder="Contact person name"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.contactNo || ''}
            onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
            placeholder="+91 1234567890"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.contactEmail || ''}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
            placeholder="email@example.com"
          />
        </div>
      </div>
    </div>

    {/* === SECTION 5: Rental Information === */}
    <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Rental Information</h5>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.isRented || false}
          onChange={(e) => setFormData({ ...formData, isRented: e.target.checked })}
          className="rounded border-gray-300"
        />
        <label className="text-sm text-gray-700 dark:text-gray-300">
          This infrastructure is rented
        </label>
      </div>

      {formData.isRented && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Rent (₹)
              </label>
              <input
                type="number"
                value={formData.rentAmount || ''}
                onChange={(e) => setFormData({ ...formData, rentAmount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Amount"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Agreement Start Date
              </label>
              <input
                type="date"
                value={formData.agreementDates?.start ? new Date(formData.agreementDates.start).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  agreementDates: {
                    ...formData.agreementDates,
                    start: new Date(e.target.value)
                  } as any
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Agreement End Date
              </label>
              <input
                type="date"
                value={formData.agreementDates?.end ? new Date(formData.agreementDates.end).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  agreementDates: {
                    ...formData.agreementDates,
                    end: new Date(e.target.value)
                  } as any
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Landlord Name
            </label>
            <input
              type="text"
              value={formData.landlordName || ''}
              onChange={(e) => setFormData({ ...formData, landlordName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
              placeholder="Landlord name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Landlord Contact
            </label>
            <input
              type="text"
              value={formData.landlordContact || ''}
              onChange={(e) => setFormData({ ...formData, landlordContact: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
              placeholder="Landlord contact number"
            />
          </div>
        </>
      )}
    </div>

    {/* === SECTION 6: Owner & Business Information === */}
    <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Owner & Business</h5>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Owner Name
        </label>
        <input
          type="text"
          value={formData.owner || ''}
          onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
          placeholder="Owner name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nature of Business
        </label>
        <input
          type="text"
          value={formData.natureOfBusiness || ''}
          onChange={(e) => setFormData({ ...formData, natureOfBusiness: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
          placeholder="E.g., Telecom, ISP, Data Center"
        />
      </div>
    </div>

    {/* === SECTION 7: Technical Details === */}
    <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Technical Details</h5>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Structure Type
          </label>
          <select
            value={formData.structureType || 'Tower'}
            onChange={(e) => setFormData({ ...formData, structureType: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="Tower">Tower</option>
            <option value="Building">Building</option>
            <option value="Ground">Ground</option>
            <option value="Rooftop">Rooftop</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Power Source
          </label>
          <select
            value={formData.powerSource || 'Grid'}
            onChange={(e) => setFormData({ ...formData, powerSource: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="Grid">Grid</option>
            <option value="Solar">Solar</option>
            <option value="Generator">Generator</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* UPS */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.upsAvailability || false}
          onChange={(e) => setFormData({ ...formData, upsAvailability: e.target.checked })}
          className="rounded border-gray-300"
        />
        <label className="text-sm text-gray-700 dark:text-gray-300">
          UPS Available
        </label>
      </div>

      {formData.upsAvailability && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            UPS Capacity
          </label>
          <input
            type="text"
            value={formData.upsCapacity || ''}
            onChange={(e) => setFormData({ ...formData, upsCapacity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
            placeholder="e.g., 10 KVA"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Backup Capacity
        </label>
        <input
          type="text"
          value={formData.backupCapacity || ''}
          onChange={(e) => setFormData({ ...formData, backupCapacity: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
          placeholder="e.g., 4 hours, 20 KVA"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bandwidth
        </label>
        <input
          type="text"
          value={formData.bandwidth || ''}
          onChange={(e) => setFormData({ ...formData, bandwidth: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
          placeholder="e.g., 1 Gbps, 100 Mbps"
        />
      </div>
    </div>

    {/* === SECTION 8: Additional Notes === */}
    <div className="space-y-3 pb-3">
      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Additional Information</h5>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
          placeholder="Any additional notes or comments..."
        />
      </div>
    </div>

    {/* === Action Buttons === */}
    <div className="flex space-x-2 pt-2 sticky bottom-0 bg-gray-50 dark:bg-gray-900 pb-2">
      <button
        onClick={resetForm}
        type="button"
        disabled={isLoading}
        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={handleAddInfrastructure}
        type="button"
        disabled={isLoading}
        className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        Add Infrastructure
      </button>
    </div>
  </div>
)}
