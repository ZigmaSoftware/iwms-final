import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { encryptSegment } from "@/utils/routeCrypto";
import { adminApi } from "@/helpers/admin";

/* ------------------------------
    TYPES
------------------------------ */
type SelectOption = { value: string; label: string };

type CountryMeta = {
  id: string;
  name: string;
  continentId: string | null;
  isActive: boolean;
};

type StateMeta = {
  id: string;
  name: string;
  countryId: string | null;
  isActive: boolean;
};

type DistrictMeta = {
  id: string;
  name: string;
  stateId: string | null;
  isActive: boolean;
};

type CityMeta = {
  id: string;
  name: string;
  districtId: string | null;
  isActive: boolean;
};

type ZoneMeta = {
  id: string;
  name: string;
  cityId: string | null;
  isActive: boolean;
};

type WardRecord = {
  name?: string;
  is_active?: boolean;
  description?: string;

  continent_id?: string | number | null;
  country_id?: string | number | null;
  state_id?: string | number | null;
  district_id?: string | number | null;
  city_id?: string | number | null;
  zone_id?: string | number | null;

  continent?: string | number | null;
  country?: string | number | null;
  state?: string | number | null;
  district?: string | number | null;
  city?: string | number | null;
  zone?: string | number | null;
};

/* ------------------------------
  UTILITIES
------------------------------ */
const normalizeNullable = (v: any): string | null => {
  if (v === undefined || v === null) return null;
  return String(v);
};

const extractErr = (e: any): string => {
  if (e?.response?.data) return String(e.response.data);
  if (e?.message) return e.message;
  return "Unexpected error";
};

/* ------------------------------
  ROUTES
------------------------------ */
const encMasters = encryptSegment("masters");
const encWards = encryptSegment("wards");
const ENC_LIST_PATH = `/${encMasters}/${encWards}`;

/* ------------------------------
  APIS
------------------------------ */
const continentApi = adminApi.continents;
const countryApi = adminApi.countries;
const stateApi = adminApi.states;
const districtApi = adminApi.districts;
const cityApi = adminApi.cities;
const zoneApi = adminApi.zones;
const wardApi = adminApi.wards;

/* ==========================================================
      COMPONENT
========================================================== */
export default function WardForm() {
  /* FORM FIELDS */
  const [wardName, setWardName] = useState("");
  const [continentId, setContinentId] = useState("");
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [cityId, setCityId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");

  /* PENDING CHAINS (Edit Support) */
  const [pendingContinent, setPendingContinent] = useState("");
  const [pendingCountry, setPendingCountry] = useState("");
  const [pendingState, setPendingState] = useState("");
  const [pendingDistrict, setPendingDistrict] = useState("");
  const [pendingCity, setPendingCity] = useState("");
  const [pendingZone, setPendingZone] = useState("");

  /* MASTER DATA */
  const [continents, setContinents] = useState<SelectOption[]>([]);
  const [allCountries, setAllCountries] = useState<CountryMeta[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<SelectOption[]>([]);

  const [allStates, setAllStates] = useState<StateMeta[]>([]);
  const [filteredStates, setFilteredStates] = useState<SelectOption[]>([]);

  const [allDistricts, setAllDistricts] = useState<DistrictMeta[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<SelectOption[]>([]);

  const [allCities, setAllCities] = useState<CityMeta[]>([]);
  const [filteredCities, setFilteredCities] = useState<SelectOption[]>([]);

  const [allZones, setAllZones] = useState<ZoneMeta[]>([]);
  const [filteredZones, setFilteredZones] = useState<SelectOption[]>([]);

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  /* ==========================================================
      LOAD MASTER DATA
  ========================================================== */
  useEffect(() => {
    continentApi
      .list()
      .then((res: any) =>
        setContinents(
          res
            .filter((x: any) => x.is_active)
            .map((x: any) => ({
              value: String(x.unique_id),
              label: x.name,
            }))
        )
      )
      .catch((err) => Swal.fire("Error", extractErr(err), "error"));
  }, []);

  useEffect(() => {
    countryApi
      .list()
      .then((res: any) =>
        setAllCountries(
          res.map((c: any) => ({
            id: String(c.unique_id),
            name: c.name,
            continentId: normalizeNullable(c.continent_id ?? c.continent),
            isActive: Boolean(c.is_active),
          }))
        )
      )
      .catch((err) => Swal.fire("Error", extractErr(err), "error"));
  }, []);

  useEffect(() => {
    stateApi
      .list()
      .then((res: any) =>
        setAllStates(
          res.map((s: any) => ({
            id: String(s.unique_id),
            name: s.name,
            countryId: normalizeNullable(s.country_id ?? s.country),
            isActive: Boolean(s.is_active),
          }))
        )
      )
      .catch((err) => Swal.fire("Error", extractErr(err), "error"));
  }, []);

  useEffect(() => {
    districtApi
      .list()
      .then((res: any) =>
        setAllDistricts(
          res.map((d: any) => ({
            id: String(d.unique_id),
            name: d.name,
            stateId: normalizeNullable(d.state_id ?? d.state),
            isActive: Boolean(d.is_active),
          }))
        )
      )
      .catch((err) => Swal.fire("Error", extractErr(err), "error"));
  }, []);

  useEffect(() => {
    cityApi
      .list()
      .then((res: any) =>
        setAllCities(
          res.map((c: any) => ({
            id: String(c.unique_id),
            name: c.name,
            districtId: normalizeNullable(c.district_id ?? c.district),
            isActive: Boolean(c.is_active),
          }))
        )
      )
      .catch((err) => Swal.fire("Error", extractErr(err), "error"));
  }, []);

  useEffect(() => {
    zoneApi
      .list()
      .then((res: any) =>
        setAllZones(
          res.map((z: any) => ({
            id: String(z.unique_id),
            name: z.name,
            cityId: normalizeNullable(z.city_id ?? z.city),
            isActive: Boolean(z.is_active),
          }))
        )
      )
      .catch((err) => Swal.fire("Error", extractErr(err), "error"));
  }, []);

  /* ==========================================================
        FILTER CHAINS
  ========================================================== */
  useEffect(() => {
    if (!continentId) {
      setFilteredCountries([]);
      return;
    }

    const filt = allCountries
      .filter((c) => c.isActive && c.continentId === continentId)
      .map((c) => ({ value: c.id, label: c.name }));

    if (pendingCountry && !filt.some((o) => o.value === pendingCountry)) {
      const found = allCountries.find((c) => c.id === pendingCountry);
      if (found) filt.push({ value: found.id, label: found.name });
    }

    setFilteredCountries(filt);
  }, [continentId, allCountries, pendingCountry]);

  useEffect(() => {
    if (!countryId) {
      setFilteredStates([]);
      return;
    }

    const filt = allStates
      .filter((s) => s.isActive && s.countryId === countryId)
      .map((s) => ({ value: s.id, label: s.name }));

    if (pendingState && !filt.some((o) => o.value === pendingState)) {
      const found = allStates.find((s) => s.id === pendingState);
      if (found) filt.push({ value: found.id, label: found.name });
    }

    setFilteredStates(filt);
  }, [countryId, allStates, pendingState]);

  useEffect(() => {
    if (!stateId) {
      setFilteredDistricts([]);
      return;
    }

    const filt = allDistricts
      .filter((d) => d.isActive && d.stateId === stateId)
      .map((d) => ({ value: d.id, label: d.name }));

    if (pendingDistrict && !filt.some((o) => o.value === pendingDistrict)) {
      const found = allDistricts.find((d) => d.id === pendingDistrict);
      if (found) filt.push({ value: found.id, label: found.name });
    }

    setFilteredDistricts(filt);
  }, [stateId, allDistricts, pendingDistrict]);

  useEffect(() => {
    if (!districtId) {
      setFilteredCities([]);
      return;
    }

    const filt = allCities
      .filter((c) => c.isActive && c.districtId === districtId)
      .map((c) => ({ value: c.id, label: c.name }));

    if (pendingCity && !filt.some((o) => o.value === pendingCity)) {
      const found = allCities.find((c) => c.id === pendingCity);
      if (found) filt.push({ value: found.id, label: found.name });
    }

    setFilteredCities(filt);
  }, [districtId, allCities, pendingCity]);

  useEffect(() => {
    if (!cityId) {
      setFilteredZones([]);
      return;
    }

    const filt = allZones
      .filter((z) => z.isActive && z.cityId === cityId)
      .map((z) => ({ value: z.id, label: z.name }));

    if (pendingZone && !filt.some((o) => o.value === pendingZone)) {
      const found = allZones.find((z) => z.id === pendingZone);
      if (found) filt.push({ value: found.id, label: found.name });
    }

    setFilteredZones(filt);
  }, [cityId, allZones, pendingZone]);

  /* ==========================================================
        EDIT MODE
  ========================================================== */
  useEffect(() => {
    if (!isEdit || !id) return;

    wardApi
      .get(id)
      .then((data: WardRecord) => {
        setWardName(data.name ?? "");
        setIsActive(Boolean(data.is_active));
        setDescription(data.description ?? "");

        const cont = normalizeNullable(data.continent_id);
        const ctr = normalizeNullable(data.country_id);
        const ste = normalizeNullable(data.state_id);
        const dis = normalizeNullable(data.district_id);
        const cty = normalizeNullable(data.city_id);
        const zne = normalizeNullable(data.zone_id);

        cont && setPendingContinent(cont);
        ctr && setPendingCountry(ctr);
        ste && setPendingState(ste);
        dis && setPendingDistrict(dis);
        cty && setPendingCity(cty);
        zne && setPendingZone(zne);
      })
      .catch((err) => Swal.fire("Error", extractErr(err), "error"));
  }, [id, isEdit]);

  /* ==========================================================
        AUTO-INFER CHAINS
  ========================================================== */
  useEffect(() => {
    if (
      pendingContinent &&
      continents.length > 0 &&
      continents.some((c) => c.value === pendingContinent)
    ) {
      setContinentId(pendingContinent);
      setPendingContinent("");
    }
  }, [pendingContinent, continents]);

  useEffect(() => {
    if (
      pendingCountry &&
      filteredCountries.length > 0 &&
      filteredCountries.some((o) => o.value === pendingCountry)
    ) {
      setCountryId(pendingCountry);
      setPendingCountry("");
    }
  }, [pendingCountry, filteredCountries]);

  useEffect(() => {
    if (
      pendingState &&
      filteredStates.length > 0 &&
      filteredStates.some((o) => o.value === pendingState)
    ) {
      setStateId(pendingState);
      setPendingState("");
    }
  }, [pendingState, filteredStates]);

  useEffect(() => {
    if (
      pendingDistrict &&
      filteredDistricts.length > 0 &&
      filteredDistricts.some((o) => o.value === pendingDistrict)
    ) {
      setDistrictId(pendingDistrict);
      setPendingDistrict("");
    }
  }, [pendingDistrict, filteredDistricts]);

  useEffect(() => {
    if (
      pendingCity &&
      filteredCities.length > 0 &&
      filteredCities.some((o) => o.value === pendingCity)
    ) {
      setCityId(pendingCity);
      setPendingCity("");
    }
  }, [pendingCity, filteredCities]);

  useEffect(() => {
    if (
      pendingZone &&
      filteredZones.length > 0 &&
      filteredZones.some((o) => o.value === pendingZone)
    ) {
      setZoneId(pendingZone);
      setPendingZone("");
    }
  }, [pendingZone, filteredZones]);

  /* ==========================================================
        FORM SUBMIT
  ========================================================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!continentId || !countryId || !stateId || !wardName.trim()) {
      Swal.fire("Missing Fields", "All mandatory fields must be filled.", "warning");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: wardName.trim(),
        continent_id: continentId,
        country_id: countryId,
        state_id: stateId,
        district_id: districtId || null,
        city_id: cityId || null,
        zone_id: zoneId || null,
        description,
        is_active: isActive,
      };

      if (isEdit && id) {
        await wardApi.update(id, payload);
        Swal.fire("Success", "Updated successfully!", "success");
      } else {
        await wardApi.create(payload);
        Swal.fire("Success", "Added successfully!", "success");
      }

      navigate(ENC_LIST_PATH);
    } catch (err) {
      Swal.fire("Save failed", extractErr(err), "error");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
        JSX
  ========================================================== */
  return (
    <ComponentCard title={isEdit ? "Edit Ward" : "Add Ward"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Continent */}
          <div>
            <Label>Continent *</Label>
            <Select
              value={continentId}
              onValueChange={(val) => {
                setContinentId(val);
                setCountryId("");
                setStateId("");
                setDistrictId("");
                setCityId("");
                setZoneId("");

                setPendingCountry("");
                setPendingState("");
                setPendingDistrict("");
                setPendingCity("");
                setPendingZone("");
              }}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder="Select Continent" />
              </SelectTrigger>
              <SelectContent>
                {continents.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div>
            <Label>Country *</Label>
            <Select
              value={countryId}
              onValueChange={(val) => {
                setCountryId(val);
                setStateId("");
                setDistrictId("");
                setCityId("");
                setZoneId("");

                setPendingState("");
                setPendingDistrict("");
                setPendingCity("");
                setPendingZone("");
              }}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {filteredCountries.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* State */}
          <div>
            <Label>State *</Label>
            <Select
              value={stateId}
              onValueChange={(val) => {
                setStateId(val);
                setDistrictId("");
                setCityId("");
                setZoneId("");

                setPendingDistrict("");
                setPendingCity("");
                setPendingZone("");
              }}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {filteredStates.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* District */}
          <div>
            <Label>District</Label>
            <Select
              value={districtId}
              onValueChange={(val) => {
                setDistrictId(val);
                setCityId("");
                setZoneId("");

                setPendingCity("");
                setPendingZone("");
              }}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                {filteredDistricts.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div>
            <Label>City</Label>
            <Select
              value={cityId}
              onValueChange={(val) => {
                setCityId(val);
                setZoneId("");
                setPendingZone("");
              }}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {filteredCities.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zone */}
          <div>
            <Label>Zone</Label>
            <Select
              value={zoneId}
              onValueChange={(val) => setZoneId(val)}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder="Select Zone" />
              </SelectTrigger>
              <SelectContent>
                {filteredZones.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ward Name */}
          <div>
            <Label>Ward Name *</Label>
            <Input
              value={wardName}
              onChange={(e) => setWardName(e.target.value)}
              placeholder="Enter ward name"
              required
            />
          </div>

          {/* Active Status */}
          <div>
            <Label>Active Status *</Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(v) => setIsActive(v === "true")}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full border rounded-md p-2 focus:ring focus:ring-green-200 outline-none"
              rows={3}
            />
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="submit" disabled={loading}>
            {loading
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
                ? "Update"
                : "Save"}
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={() => navigate(ENC_LIST_PATH)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}