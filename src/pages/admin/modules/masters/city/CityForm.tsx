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
import { useTranslation } from "react-i18next";

import { continentApi, countryApi, stateApi, districtApi, cityApi } from "@/helpers/admin";

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

type CityRecord = {
  name?: string;
  is_active?: boolean;

  continent_id?: string | number | null;
  continent?: string | number | null;

  country_id?: string | number | null;
  country?: string | number | null;

  state_id?: string | number | null;
  state?: string | number | null;

  district_id?: string | number | null;
  district?: string | number | null;
};

/* ------------------------------
    UTILITIES
------------------------------ */
const normalizeNullable = (v: any): string | null => {
  if (v === undefined || v === null) return null;
  return String(v);
};

const extractError = (error: any): string => {
  if (error?.response?.data) return String(error.response.data);
  if (error?.message) return error.message;
  return "Unexpected error!";
};

/* ------------------------------
    ROUTES
------------------------------ */
const encMasters = encryptSegment("masters");
const encCities = encryptSegment("cities");
const ENC_LIST_PATH = `/${encMasters}/${encCities}`;


/* ==========================================================
    COMPONENT STARTS
========================================================== */
export default function CityForm() {
  const { t } = useTranslation();
  /* FIELD STATES */
  const [cityName, setCityName] = useState("");
  const [continentId, setContinentId] = useState("");
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");

  /* PENDING STATES */
  const [pendingCountryId, setPendingCountryId] = useState("");
  const [pendingStateId, setPendingStateId] = useState("");
  const [pendingDistrictId, setPendingDistrictId] = useState("");

  /* MASTER DATA */
  const [continents, setContinents] = useState<SelectOption[]>([]);
  const [allCountries, setAllCountries] = useState<CountryMeta[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<SelectOption[]>([]);

  const [allStates, setAllStates] = useState<StateMeta[]>([]);
  const [filteredStates, setFilteredStates] = useState<SelectOption[]>([]);

  const [allDistricts, setAllDistricts] = useState<DistrictMeta[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<SelectOption[]>([]);

  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  /* ==========================================================
      LOAD MASTER DATA
  ========================================================== */
  useEffect(() => {
    (async () => {
      try {
        const res = await continentApi.list();
        setContinents(
          res
            .filter((x: any) => x.is_active)
            .map((x: any) => ({
              value: String(x.unique_id),
              label: x.name,
            }))
        );
      } catch (err) {
        Swal.fire(t("common.error"), extractError(err), "error");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await countryApi.list();
        const mapped = res.map((c: any) => ({
          id: String(c.unique_id),
          name: c.name,
          continentId: normalizeNullable(c.continent_id ?? c.continent),
          isActive: Boolean(c.is_active),
        }));
        setAllCountries(mapped);
      } catch (err) {
        Swal.fire(t("common.error"), extractError(err), "error");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await stateApi.list();
        const mapped = res.map((s: any) => ({
          id: String(s.unique_id),
          name: s.name,
          countryId: normalizeNullable(s.country_id ?? s.country),
          isActive: Boolean(s.is_active),
        }));
        setAllStates(mapped);
      } catch (err) {
        Swal.fire(t("common.error"), extractError(err), "error");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await districtApi.list();
        const mapped = res.map((d: any) => ({
          id: String(d.unique_id),
          name: d.name,
          stateId: normalizeNullable(d.state_id ?? d.state),
          isActive: Boolean(d.is_active),
        }));
        setAllDistricts(mapped);
      } catch (err) {
        Swal.fire(t("common.error"), extractError(err), "error");
      }
    })();
  }, []);

  /* ==========================================================
      FILTER COUNTRIES BASED ON SELECTED CONTINENT
  ========================================================== */
  useEffect(() => {
    if (!continentId) {
      setFilteredCountries([]);
      return;
    }

    const filt = allCountries
      .filter((c) => c.isActive && c.continentId === continentId)
      .map((c) => ({ value: c.id, label: c.name }));

    if (
      pendingCountryId &&
      !filt.some((o) => o.value === pendingCountryId)
    ) {
      const found = allCountries.find((c) => c.id === pendingCountryId);
      if (found) {
        filt.push({ value: found.id, label: found.name });
      }
    }

    setFilteredCountries(filt);
  }, [continentId, allCountries, pendingCountryId]);

  /* ==========================================================
      FILTER STATES BASED ON SELECTED COUNTRY
  ========================================================== */
  useEffect(() => {
    if (!countryId) {
      setFilteredStates([]);
      return;
    }

    const filt = allStates
      .filter((s) => s.isActive && s.countryId === countryId)
      .map((s) => ({ value: s.id, label: s.name }));

    if (
      pendingStateId &&
      !filt.some((o) => o.value === pendingStateId)
    ) {
      const found = allStates.find((s) => s.id === pendingStateId);
      if (found) {
        filt.push({ value: found.id, label: found.name });
      }
    }

    setFilteredStates(filt);
  }, [countryId, allStates, pendingStateId]);

  /* ==========================================================
      FILTER DISTRICTS BY STATE
  ========================================================== */
  useEffect(() => {
    if (!stateId) {
      setFilteredDistricts([]);
      return;
    }

    const filt = allDistricts
      .filter((d) => d.isActive && d.stateId === stateId)
      .map((d) => ({ value: d.id, label: d.name }));

    if (
      pendingDistrictId &&
      !filt.some((o) => o.value === pendingDistrictId)
    ) {
      const found = allDistricts.find((d) => d.id === pendingDistrictId);
      if (found) {
        filt.push({ value: found.id, label: found.name });
      }
    }

    setFilteredDistricts(filt);
  }, [stateId, allDistricts, pendingDistrictId]);

  /* ==========================================================
      APPLY PENDING COUNTRY WHEN FILTER READY
  ========================================================== */
  useEffect(() => {
    if (
      pendingCountryId &&
      filteredCountries.some((o) => o.value === pendingCountryId)
    ) {
      setCountryId(pendingCountryId);
      setPendingCountryId("");
    }
  }, [filteredCountries, pendingCountryId]);

  /* ==========================================================
      APPLY PENDING STATE WHEN FILTER READY
  ========================================================== */
  useEffect(() => {
    if (
      pendingStateId &&
      filteredStates.some((o) => o.value === pendingStateId)
    ) {
      setStateId(pendingStateId);
      setPendingStateId("");
    }
  }, [filteredStates, pendingStateId]);

  /* ==========================================================
      APPLY PENDING DISTRICT WHEN FILTER READY
  ========================================================== */
  useEffect(() => {
    if (
      pendingDistrictId &&
      filteredDistricts.some((o) => o.value === pendingDistrictId)
    ) {
      setDistrictId(pendingDistrictId);
      setPendingDistrictId("");
    }
  }, [filteredDistricts, pendingDistrictId]);

  /* ==========================================================
      AUTO-RESOLVE CHAINS
  ========================================================== */

  // If only pendingCountry exists → set continent
  useEffect(() => {
    if (!continentId && pendingCountryId) {
      const found = allCountries.find((c) => c.id === pendingCountryId);
      if (found?.continentId) {
        setContinentId(found.continentId);
      }
    }
  }, [pendingCountryId, continentId, allCountries]);

  // If only pendingState exists → get country
  useEffect(() => {
    if (!countryId && pendingStateId) {
      const found = allStates.find((s) => s.id === pendingStateId);
      if (found?.countryId) {
        setCountryId(found.countryId);
        setPendingCountryId(found.countryId);
      }
    }
  }, [pendingStateId, countryId, allStates]);

  // If only pendingDistrict exists → get state
  useEffect(() => {
    if (!stateId && pendingDistrictId) {
      const found = allDistricts.find((d) => d.id === pendingDistrictId);
      if (found?.stateId) {
        setStateId(found.stateId);
        setPendingStateId(found.stateId);
      }
    }
  }, [pendingDistrictId, stateId, allDistricts]);

  /* ==========================================================
      EDIT MODE — LOAD EXISTING CITY
  ========================================================== */
  useEffect(() => {
    if (!isEdit || !id) return;

    (async () => {
      try {
        const data: CityRecord = await cityApi.get(id);

        setCityName(data.name ?? "");
        setIsActive(Boolean(data.is_active));

        const cont = normalizeNullable(data.continent_id ?? data.continent);
        const ctr = normalizeNullable(data.country_id ?? data.country);
        const ste = normalizeNullable(data.state_id ?? data.state);
        const dis = normalizeNullable(data.district_id ?? data.district);

        setContinentId(cont ?? "");
        setPendingCountryId(ctr ?? "");
        setPendingStateId(ste ?? "");
        setPendingDistrictId(dis ?? "");
      } catch (err) {
        Swal.fire(t("common.error"), extractError(err), "error");
      }
    })();
  }, [id, isEdit]);

  /* ==========================================================
      SUBMIT
  ========================================================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!continentId || !countryId || !stateId || !districtId || !cityName.trim()) {
      Swal.fire(t("common.warning"), t("common.all_fields_required"), "warning");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: cityName.trim(),
        continent_id: continentId,
        country_id: countryId,
        state_id: stateId,
        district_id: districtId,
        is_active: isActive,
      };

      if (isEdit && id) {
        await cityApi.update(id, payload);
        Swal.fire(t("common.success"), t("common.updated_success"), "success");
      } else {
        await cityApi.create(payload);
        Swal.fire(t("common.success"), t("common.added_success"), "success");
      }

      navigate(ENC_LIST_PATH);
    } catch (err) {
      Swal.fire(t("common.save_failed"), extractError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
      JSX
  ========================================================== */
  return (
    <ComponentCard
      title={
        isEdit
          ? t("common.edit_item", { item: t("admin.nav.city") })
          : t("common.add_item", { item: t("admin.nav.city") })
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Continent */}
          <div>
            <Label>{t("admin.nav.continent")} *</Label>
            <Select
              value={continentId}
              onValueChange={(val) => {
                setContinentId(val);
                setCountryId("");
                setStateId("");
                setDistrictId("");

                setPendingCountryId("");
                setPendingStateId("");
                setPendingDistrictId("");
              }}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue
                  placeholder={t("common.select_item_placeholder", {
                    item: t("admin.nav.continent"),
                  })}
                />
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
            <Label>{t("admin.nav.country")} *</Label>
            <Select
              value={countryId}
              onValueChange={(val) => {
                setCountryId(val);
                setStateId("");
                setDistrictId("");

                setPendingStateId("");
                setPendingDistrictId("");
              }}
              disabled={!continentId}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue
                  placeholder={t("common.select_item_placeholder", {
                    item: t("admin.nav.country"),
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {filteredCountries.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {continentId
                      ? t("common.no_items_found", {
                          item: t("admin.nav.country"),
                        })
                      : t("common.select_item_first", {
                          item: t("admin.nav.continent"),
                        })}
                  </div>
                ) : (
                  filteredCountries.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* State */}
          <div>
            <Label>{t("admin.nav.state")} *</Label>
            <Select
              value={stateId}
              onValueChange={(val) => {
                setStateId(val);
                setDistrictId("");
                setPendingDistrictId("");
              }}
              disabled={!countryId}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue
                  placeholder={t("common.select_item_placeholder", {
                    item: t("admin.nav.state"),
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {filteredStates.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {countryId
                      ? t("common.no_items_found", {
                          item: t("admin.nav.state"),
                        })
                      : t("common.select_item_first", {
                          item: t("admin.nav.country"),
                        })}
                  </div>
                ) : (
                  filteredStates.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* District */}
          <div>
            <Label>{t("admin.nav.district")} *</Label>
            <Select
              value={districtId}
              onValueChange={(val) => setDistrictId(val)}
              disabled={!stateId}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue
                  placeholder={t("common.select_item_placeholder", {
                    item: t("admin.nav.district"),
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {filteredDistricts.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {stateId
                      ? t("common.no_items_found", {
                          item: t("admin.nav.district"),
                        })
                      : t("common.select_item_first", {
                          item: t("admin.nav.state"),
                        })}
                  </div>
                ) : (
                  filteredDistricts.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div>
            <Label>
              {t("common.item_name", { item: t("admin.nav.city") })} *
            </Label>
            <Input
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder={t("common.enter_item_name", {
                item: t("admin.nav.city"),
              })}
              className="input-validate w-full"
              required
            />
          </div>

          {/* Status */}
          <div>
            <Label>{t("common.status")} *</Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(v) => setIsActive(v === "true")}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder={t("common.select_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t("common.active")}</SelectItem>
                <SelectItem value="false">{t("common.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="submit" disabled={loading}>
            {loading
              ? isEdit
                ? t("common.updating")
                : t("common.saving")
              : isEdit
              ? t("common.update")
              : t("common.save")}
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={() => navigate(ENC_LIST_PATH)}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
