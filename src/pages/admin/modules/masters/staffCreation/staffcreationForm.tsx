import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { desktopApi } from "@/api";
import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { getEncryptedRoute } from "@/utils/routeCache";
import { staffCreationApi } from "@/helpers/admin";
import {
    countryApi,
    stateApi,
    districtApi,
    cityApi,
} from "@/helpers/admin/index";

type Section = "official" | "personal";

const gradeOptions = [
  { value: "Grade A", label: "Grade A" },
  { value: "Grade B", label: "Grade B" },
  { value: "Grade C", label: "Grade C" },
  { value: "Grade D", label: "Grade D" },
];

const siteOptions = [
  { value: "Erode (Head Office)", label: "Erode (Head Office)" },
  { value: "Coimbatore", label: "Coimbatore" },
  { value: "Chennai", label: "Chennai" },
  { value: "Hyderabad", label: "Hyderabad" },
];

const salaryTypeOptions = [
  { value: "Monthly", label: "Monthly" },
  { value: "Daily", label: "Daily" },
  { value: "Contract", label: "Contract" },
];

const yesNoOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const maritalStatusOptions = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Widowed", label: "Widowed" },
  { value: "Divorced", label: "Divorced" },
];

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const bloodGroupOptions = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

const mapLocationOptions = (items: any[]) =>
  (items ?? [])
    .filter((item) => item?.name && item.is_active !== false)
    .map((item) => ({ value: item.name, label: item.name }));

type ErrorWithResponse = {
  response?: {
    data?: unknown;
  };
};

const formatErrorMessage = (error: unknown) => {
  if (!error) return "Please review the highlighted fields.";
  if (typeof error === "string") return error;

  const data = (error as ErrorWithResponse)?.response?.data;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.join(", ");

  const payload =
    data && typeof data === "object" && "errors" in data ? (data as any).errors : data;

  if (payload && typeof payload === "object") {
    return Object.entries(payload as Record<string, unknown>)
      .map(([key, value]) =>
        Array.isArray(value) ? `${key}: ${value.join(", ")}` : `${key}: ${String(value)}`
      )
      .join("\n");
  }

  return "Please review the highlighted fields.";
};

const initialFormData = {
  employee_name: "",
  // employee_id: "",
  doj: "",
  department: "",
  designation: "",
  department_id: "",
  designation_id: "",
  grade: "",
  site_name: "",
  biometric_id: "",
  staff_head: "",
  staff_head_id: "",
  employee_known: "",
  salary_type: "",
  active_status: "1",
  marital_status: "",
  dob: "",
  blood_group: "",
  gender: "",
  physically_challenged: "",
  extra_curricular: "",
  present_country: "",
  present_state: "",
  present_district: "",
  present_city: "",
  present_building_no: "",
  present_street: "",
  present_area: "",
  present_pincode: "",
  permanent_country: "",
  permanent_state: "",
  permanent_district: "",
  permanent_city: "",
  permanent_building_no: "",
  permanent_street: "",
  permanent_area: "",
  permanent_pincode: "",
  contact_mobile: "",
  contact_email: "",
  // emergency_contact: "",
  // emergency_mobile: "",
};

export default function StaffCreationForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [section, setSection] = useState<Section>("official");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
  const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([]);
  const [districtOptions, setDistrictOptions] = useState<{ value: string; label: string }[]>([]);
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([]);

  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const { encMasters, encStaffCreation } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encMasters}/${encStaffCreation}`;
  const backendOrigin =
    desktopApi.defaults.baseURL?.replace(/\/api\/desktop\/?$/, "") || "";

  useEffect(() => {
    const loadLocationOptions = async () => {
      try {
        const [countries, states, districts, cities] = await Promise.all([
          countryApi.list(),
          stateApi.list(),
          districtApi.list(),
          cityApi.list(),
        ]);

        setCountryOptions(mapLocationOptions(countries));
        setStateOptions(mapLocationOptions(states));
        setDistrictOptions(mapLocationOptions(districts));
        setCityOptions(mapLocationOptions(cities));
      } catch (error) {
        console.error("Failed to load location masters", error);
      }
    };

    void loadLocationOptions();
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    setFetching(true);

    staffCreationApi
      .get(id)
      .then((staff) => {
        setFormData((prev) => ({
  ...prev,

  // Office details
  employee_name: staff.employee_name ?? "",
  doj: staff.doj ?? "",
  department: staff.department ?? "",
  designation: staff.designation ?? "",
  department_id: staff.department_id ?? "",
  designation_id: staff.designation_id ?? "",
  grade: staff.grade ?? "",
  site_name: staff.site_name ?? "",
  biometric_id: staff.biometric_id ?? "",
  staff_head: staff.staff_head ?? "",
  staff_head_id: staff.staff_head_id ?? "",
  employee_known: staff.employee_known ?? "",
  salary_type: staff.salary_type ?? "",
  active_status: staff.active_status ? "1" : "0",

  // Personal details (FLAT — NOT nested)
  marital_status: staff.marital_status ?? "",
  dob: staff.dob ?? "",
  blood_group: staff.blood_group ?? "",
  gender: staff.gender ?? "",
  physically_challenged: staff.physically_challenged ?? "",
  extra_curricular: staff.extra_curricular ?? "",

  // JSON Address — Present
  present_country: staff.present_address?.country ?? "",
  present_state: staff.present_address?.state ?? "",
  present_district: staff.present_address?.district ?? "",
  present_city: staff.present_address?.city ?? "",
  present_building_no: staff.present_address?.building_no ?? "",
  present_street: staff.present_address?.street ?? "",
  present_area: staff.present_address?.area ?? "",
  present_pincode: staff.present_address?.pincode ?? "",

  // JSON Address — Permanent
  permanent_country: staff.permanent_address?.country ?? "",
  permanent_state: staff.permanent_address?.state ?? "",
  permanent_district: staff.permanent_address?.district ?? "",
  permanent_city: staff.permanent_address?.city ?? "",
  permanent_building_no: staff.permanent_address?.building_no ?? "",
  permanent_street: staff.permanent_address?.street ?? "",
  permanent_area: staff.permanent_address?.area ?? "",
  permanent_pincode: staff.permanent_address?.pincode ?? "",

  // Contact details (FLAT — NOT nested)
  contact_mobile: staff.contact_mobile ?? "",
  contact_email: staff.contact_email ?? "",
}));

console.log("Fetched staff data:", staff);
        if (staff.photo) {
          setPhotoPreview(
            staff.photo.startsWith("http")
              ? staff.photo
              : `${backendOrigin}${staff.photo}`
          );
        }
      })
      
      .catch((error) => {
        console.error("Failed to load staff", error);
        Swal.fire({
          icon: "error",
          title: "Unable to load staff",
          text: error.response?.data?.detail || "Please try again later.",
        });
      })
      .finally(() => setFetching(false));
  }, [backendOrigin, id, isEdit]);

  useEffect(() => {
    if (!photoFile) return;
    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  useEffect(() => {
    if (!sameAddress) return;
    setFormData((prev) => ({
      ...prev,
      permanent_country: prev.present_country,
      permanent_state: prev.present_state,
      permanent_district: prev.present_district,
      permanent_city: prev.present_city,
      permanent_building_no: prev.present_building_no,
      permanent_street: prev.present_street,
      permanent_area: prev.present_area,
      permanent_pincode: prev.present_pincode,
    }));
  }, [
    sameAddress,
    formData.present_country,
    formData.present_state,
    formData.present_district,
    formData.present_city,
    formData.present_building_no,
    formData.present_street,
    formData.present_area,
    formData.present_pincode,
  ]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: keyof typeof initialFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateAge = (dobValue: string) => {
    const birthDate = new Date(dobValue);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    return age >= 0 ? age : 0;
  };

  const buildAddressPayload = (prefix: "present" | "permanent") => {
    const address = {
      country: formData[`${prefix}_country` as keyof typeof initialFormData] as string,
      state: formData[`${prefix}_state` as keyof typeof initialFormData] as string,
      district: formData[`${prefix}_district` as keyof typeof initialFormData] as string,
      city: formData[`${prefix}_city` as keyof typeof initialFormData] as string,
      building_no: formData[`${prefix}_building_no` as keyof typeof initialFormData] as string,
      street: formData[`${prefix}_street` as keyof typeof initialFormData] as string,
      area: formData[`${prefix}_area` as keyof typeof initialFormData] as string,
      pincode: formData[`${prefix}_pincode` as keyof typeof initialFormData] as string,
    };

    return Object.values(address).some((value) => Boolean(value)) ? address : null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (photoFile && !photoFile.type.startsWith("image/")) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Photo",
        text: "Please upload a valid image file.",
      });
      return;
    }
    setSubmitting(true);

    try {
    const payload: Record<string, any> = {
  employee_name: formData.employee_name,
  doj: formData.doj || null,
  department: formData.department,
  designation: formData.designation,
  department_id: formData.department_id,
  designation_id: formData.designation_id,
  grade: formData.grade,
  site_name: formData.site_name,
  biometric_id: formData.biometric_id,
  staff_head: formData.staff_head,
  staff_head_id: formData.staff_head_id,
  employee_known: formData.employee_known,
  salary_type: formData.salary_type,
  active_status: formData.active_status === "1",

  // Personal flat fields
  marital_status: formData.marital_status,
  dob: formData.dob || null,
  blood_group: formData.blood_group,
  gender: formData.gender,
  physically_challenged: formData.physically_challenged,
  extra_curricular: formData.extra_curricular,
  contact_mobile: formData.contact_mobile,
  contact_email: formData.contact_email,
  
  
};


      const presentPayload = buildAddressPayload("present");
      const permanentPayload = buildAddressPayload("permanent");

      if (presentPayload) {
        payload.present_address = presentPayload;
      }
      if (permanentPayload) {
        payload.permanent_address = permanentPayload;
      }

      // const contactPayload = {
      //   mobile_no: formData.contact_mobile,
      //   email_id: formData.contact_email,
      //   // emergency_contact: formData.emergency_contact,
      //   // emergency_mobile: formData.emergency_mobile,
      // };

      // if (Object.values(contactPayload).some((value) => Boolean(value))) {
      //   payload.contact_details = contactPayload;
      // }

      const formBody = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (value instanceof Blob) {
          formBody.append(key, value);
        } else if (typeof value === "object") {
          formBody.append(key, JSON.stringify(value));
        } else {
          formBody.append(key, value);
        }
      });

      if (photoFile) {
        formBody.append("photo", photoFile);
      }

      let response: any;
      const multipartConfig = {
        headers: { "Content-Type": "multipart/form-data" },
      };
      if (isEdit) {
        if (!id) {
          throw new Error("Missing staff id");
        }
        response = await staffCreationApi.update(id, formBody, multipartConfig);
      } else {
        response = await staffCreationApi.create(formBody, multipartConfig);
      }

      Swal.fire({
        icon: "success",
        title: isEdit ? "Staff updated" : "Staff created",
        text: response?.message || response?.data?.message || "Details saved successfully.",
      });

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      console.error("Failed to save staff", error);
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: formatErrorMessage(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const sectionButtons: { label: string; key: Section }[] = [
    { label: "Office Details", key: "official" },
    { label: "Personal Details", key: "personal" },
  ];

  const renderOfficialSection = () => (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div>
        <Label htmlFor="employee_name">Employee Name</Label>
        <Input
          id="employee_name"
          value={formData.employee_name}
          onChange={handleInputChange}
          required
        />
      </div>
      {/* <div>
        <Label htmlFor="employee_id">Employee ID</Label>
        <Input
          id="employee_id"
          value={formData.employee_id}
          onChange={handleInputChange}
        />
      </div> */}
      <div>
        <Label htmlFor="doj">Date of Joining</Label>
        <Input id="doj" type="date" value={formData.doj} onChange={handleInputChange} />
      </div>
      <div>
        <Label htmlFor="department">Department Name</Label>
        <Input
          id="department"
          value={formData.department}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Label htmlFor="designation">Designation</Label>
        <Input
          id="designation"
          value={formData.designation}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Label htmlFor="department_id">Department ID</Label>
        <Input
          id="department_id"
          value={formData.department_id}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Label htmlFor="designation_id">Designation ID</Label>
        <Input
          id="designation_id"
          value={formData.designation_id}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Label htmlFor="grade">Grade</Label>
        <Select
          id="grade"
          value={formData.grade}
          onChange={(value) => handleSelectChange("grade", value)}
          options={gradeOptions}
          placeholder="Select a grade"
        />
      </div>
      <div>
        <Label htmlFor="site_name">Site Name</Label>
        <Select
          id="site_name"
          value={formData.site_name}
          onChange={(value) => handleSelectChange("site_name", value)}
          options={siteOptions}
          placeholder="Select a site"
        />
      </div>
      <div>
        <Label htmlFor="biometric_id">Bio Metric Id</Label>
        <Input
          id="biometric_id"
          value={formData.biometric_id}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Label htmlFor="staff_head">Staff Head</Label>
        <Input
          id="staff_head"
          value={formData.staff_head}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Label htmlFor="staff_head_id">Staff Head ID</Label>
        <Input
          id="staff_head_id"
          value={formData.staff_head_id}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Label htmlFor="employee_known">Employee Known</Label>
        <Select
          id="employee_known"
          value={formData.employee_known}
          onChange={(value) => handleSelectChange("employee_known", value)}
          options={yesNoOptions}
          placeholder="Select an option"
        />
      </div>
      <div>
        <Label htmlFor="salary_type">Salary Type</Label>
        <Select
          id="salary_type"
          value={formData.salary_type}
          onChange={(value) => handleSelectChange("salary_type", value)}
          options={salaryTypeOptions}
          placeholder="Select salary type"
        />
      </div>
      <div>
        <Label htmlFor="active_status">Active Status</Label>
        <Select
          id="active_status"
          value={formData.active_status}
          onChange={(value) => handleSelectChange("active_status", value)}
          options={[
            { value: "1", label: "Active" },
            { value: "0", label: "Inactive" },
          ]}
          placeholder="Select status"
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="photo">Employee Photo</Label>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              Choose photo
            </button>
            <span className="text-sm text-gray-500">
              {photoFile?.name || "No file selected"}
            </span>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            id="photo"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              if (!file) {
                setPhotoFile(null);
                return;
              }
              if (!file.type.startsWith("image/")) {
                Swal.fire({
                  icon: "warning",
                  title: "Invalid Photo",
                  text: "Please upload a valid image file.",
                });
                event.target.value = "";
                setPhotoFile(null);
                setPhotoPreview("");
                return;
              }
              setPhotoFile(file);
            }}
          />
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Employee preview"
              className="h-32 w-32 rounded-lg border object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed px-2 text-xs text-gray-500">
              No image selected
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPersonalSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="marital_status">Marital Status</Label>
          <Select
            id="marital_status"
            value={formData.marital_status}
            onChange={(value) => handleSelectChange("marital_status", value)}
            options={maritalStatusOptions}
            placeholder="Select marital status"
          />
        </div>
        <div>
          <Label htmlFor="dob">Date of Birth</Label>
          <Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            value={formData.dob ? calculateAge(formData.dob) : ""}
            placeholder="Auto-calculated"
          />
        </div>
        <div>
          <Label htmlFor="blood_group">Blood Group</Label>
          <Select
            id="blood_group"
            value={formData.blood_group}
            onChange={(value) => handleSelectChange("blood_group", value)}
            options={bloodGroupOptions}
            placeholder="Select blood group"
          />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select
            id="gender"
            value={formData.gender}
            onChange={(value) => handleSelectChange("gender", value)}
            options={genderOptions}
            placeholder="Select gender"
          />
        </div>
        <div>
          <Label htmlFor="physically_challenged">Physically Challenged</Label>
          <Select
            id="physically_challenged"
            value={formData.physically_challenged}
            onChange={(value) => handleSelectChange("physically_challenged", value)}
            options={yesNoOptions}
            placeholder="Select an option"
          />
        </div>
        <div>
          <Label htmlFor="extra_curricular">Extra Curricular Activities</Label>
          <textarea
            id="extra_curricular"
            value={formData.extra_curricular}
            onChange={handleInputChange}
            rows={3}
            className="input-validate h-auto w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/20"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-600">Present Address Details</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="present_country">Country</Label>
              <Select
                id="present_country"
                value={formData.present_country}
                onChange={(value) => handleSelectChange("present_country", value)}
                options={countryOptions}
                placeholder="Select country"
              />
            </div>
            <div>
              <Label htmlFor="present_state">State</Label>
              <Select
                id="present_state"
                value={formData.present_state}
                onChange={(value) => handleSelectChange("present_state", value)}
                options={stateOptions}
                placeholder="Select state"
              />
            </div>
            <div>
              <Label htmlFor="present_district">District</Label>
              <Select
                id="present_district"
                value={formData.present_district}
                onChange={(value) => handleSelectChange("present_district", value)}
                options={districtOptions}
                placeholder="Select district"
              />
            </div>
            <div>
              <Label htmlFor="present_city">City</Label>
              <Select
                id="present_city"
                value={formData.present_city}
                onChange={(value) => handleSelectChange("present_city", value)}
                options={cityOptions}
                placeholder="Select city"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="present_building_no">Building No</Label>
              <Input
                id="present_building_no"
                value={formData.present_building_no}
                onChange={handleInputChange}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="present_street">Street</Label>
              <textarea
                id="present_street"
                value={formData.present_street}
                onChange={handleInputChange}
                rows={2}
                className="input-validate h-auto w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/20"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="present_area">Area</Label>
              <textarea
                id="present_area"
                value={formData.present_area}
                onChange={handleInputChange}
                rows={2}
                className="input-validate h-auto w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <Label htmlFor="present_pincode">Pincode</Label>
              <Input
                id="present_pincode"
                value={formData.present_pincode}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-600">Permanent Address Details</p>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={sameAddress}
                onChange={() => setSameAddress((prev) => !prev)}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              Same
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="permanent_country">Country</Label>
              <Select
                id="permanent_country"
                value={formData.permanent_country}
                onChange={(value) => handleSelectChange("permanent_country", value)}
                options={countryOptions}
                placeholder="Select country"
              />
            </div>
            <div>
              <Label htmlFor="permanent_state">State</Label>
              <Select
                id="permanent_state"
                value={formData.permanent_state}
                onChange={(value) => handleSelectChange("permanent_state", value)}
                options={stateOptions}
                placeholder="Select state"
              />
            </div>
            <div>
              <Label htmlFor="permanent_district">District</Label>
              <Select
                id="permanent_district"
                value={formData.permanent_district}
                onChange={(value) => handleSelectChange("permanent_district", value)}
                options={districtOptions}
                placeholder="Select district"
              />
            </div>
            <div>
              <Label htmlFor="permanent_city">City</Label>
              <Select
                id="permanent_city"
                value={formData.permanent_city}
                onChange={(value) => handleSelectChange("permanent_city", value)}
                options={cityOptions}
                placeholder="Select city"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="permanent_building_no">Building No</Label>
              <Input
                id="permanent_building_no"
                value={formData.permanent_building_no}
                onChange={handleInputChange}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="permanent_street">Street</Label>
              <textarea
                id="permanent_street"
                value={formData.permanent_street}
                onChange={handleInputChange}
                rows={2}
                className="input-validate h-auto w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/20"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="permanent_area">Area</Label>
              <textarea
                id="permanent_area"
                value={formData.permanent_area}
                onChange={handleInputChange}
                rows={2}
                className="input-validate h-auto w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <Label htmlFor="permanent_pincode">Pincode</Label>
              <Input
                id="permanent_pincode"
                value={formData.permanent_pincode}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-600">Contact Details</p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="contact_mobile">Mobile No</Label>
            <Input
              id="contact_mobile"
              value={formData.contact_mobile}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="contact_email">Email ID</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={handleInputChange}
            />
          </div>
          {/* <div>
            <Label htmlFor="emergency_contact">Emergency Contact</Label>
            <Input
              id="emergency_contact"
              value={formData.emergency_contact}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="emergency_mobile">Emergency Mobile</Label>
            <Input
              id="emergency_mobile"
              value={formData.emergency_mobile}
              onChange={handleInputChange}
            />
          </div> */}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <ComponentCard
        title={isEdit ? "Update Staff Details" : "Staff / Employee Creation"}
        desc="Fill in official and personal details to create a new staff record."
      >
        <div className="flex flex-wrap gap-3 pb-4">
          {sectionButtons.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => setSection(btn.key)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                section === btn.key
                  ? "border-brand-500 bg-brand-500/10 text-brand-600"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {section === "official" ? renderOfficialSection() : renderPersonalSection()}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="submit"
              disabled={submitting || fetching}
              className="rounded-lg bg-green-custom px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? (isEdit ? "Updating..." : "Saving...") : isEdit ? "Update" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => navigate(ENC_LIST_PATH)}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
