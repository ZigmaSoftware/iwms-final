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


import { continentApi, countryApi, stateApi, districtApi } from "@/helpers/admin";


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

type DistrictRecord = {
  name?: string;
  is_active?: boolean;
  continent_id?: string | number | null;
  country_id?: string | number | null;
  state_id?: string | number | null;
};

const encMasters = encryptSegment("masters");
const encDistricts = encryptSegment("districts");
const ENC_LIST_PATH = `/${encMasters}/${encDistricts}`;



const normalize = (v: any): string | null => {
  if (v === undefined || v === null) return null;
  return String(v);
};

export default function DistrictForm() {
  const { t } = useTranslation();
  const [districtName, setDistrictName] = useState("");
  const [continentId, setContinentId] = useState<string>("");
  const [countryId, setCountryId] = useState<string>("");
  const [stateId, setStateId] = useState<string>("");

  const [pendingCountryId, setPendingCountryId] = useState<string>("");
  const [pendingStateId, setPendingStateId] = useState<string>("");

  const [continents, setContinents] = useState<SelectOption[]>([]);
  const [allCountries, setAllCountries] = useState<CountryMeta[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<SelectOption[]>([]);
  const [allStates, setAllStates] = useState<StateMeta[]>([]);
  const [filteredStates, setFilteredStates] = useState<SelectOption[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  /* ------------------------------
     Load all dropdown master data once
  ------------------------------ */
  useEffect(() => {
    (async () => {
      const cs = await continentApi.list();
      setContinents(
        cs.filter((c: any) => c.is_active).map((c: any) => ({
          value: String(c.unique_id),
          label: c.name,
        }))
      );
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const c = await countryApi.list();
      setAllCountries(
        c.map((x: any) => ({
          id: String(x.unique_id),
          name: x.name,
          continentId: normalize(x.continent_id ?? x.continent),
          isActive: Boolean(x.is_active),
        }))
      );
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const s = await stateApi.list();
      setAllStates(
        s.map((x: any) => ({
          id: String(x.unique_id),
          name: x.name,
          countryId: normalize(x.country_id ?? x.country),
          isActive: Boolean(x.is_active),
        }))
      );
    })();
  }, []);

  /* ------------------------------
     Filter Countries on Continent change
  ------------------------------ */
  useEffect(() => {
    if (!continentId) {
      setFilteredCountries([]);
      return;
    }

    const filtered = allCountries
      .filter(
        (c) => c.isActive && c.continentId === continentId
      )
      .map((c) => ({
        value: c.id,
        label: c.name,
      }));

    // Inject pending edit value if missing
    if (
      pendingCountryId &&
      !filtered.some((o) => o.value === pendingCountryId)
    ) {
      const found = allCountries.find((c) => c.id === pendingCountryId);
      if (found) {
        filtered.push({ value: found.id, label: found.name });
      }
    }

    setFilteredCountries(filtered);
  }, [continentId, allCountries, pendingCountryId]);

  /* ------------------------------
     Filter States on Country change
  ------------------------------ */
  useEffect(() => {
    if (!countryId) {
      setFilteredStates([]);
      return;
    }

    const filtered = allStates
      .filter(
        (s) => s.isActive && s.countryId === countryId
      )
      .map((s) => ({
        value: s.id,
        label: s.name,
      }));

    if (
      pendingStateId &&
      !filtered.some((o) => o.value === pendingStateId)
    ) {
      const found = allStates.find((s) => s.id === pendingStateId);
      if (found) {
        filtered.push({ value: found.id, label: found.name });
      }
    }

    setFilteredStates(filtered);
  }, [countryId, allStates, pendingStateId]);

  /* ------------------------------
     Edit Mode — fetch district & populate
  ------------------------------ */
  useEffect(() => {
    if (!isEdit || !id) return;

    (async () => {
      const data: DistrictRecord = await districtApi.get(id);

      setDistrictName(data.name ?? "");
      setIsActive(Boolean(data.is_active));

      const cont = normalize(data.continent_id);
      const ctr = normalize(data.country_id);
      const ste = normalize(data.state_id);

      setContinentId(cont ?? "");
      setPendingCountryId(ctr ?? "");
      setPendingStateId(ste ?? "");
    })();
  }, [id, isEdit]);

  /* ------------------------------
     Auto-resolve missing continent from pending country
  ------------------------------ */
  useEffect(() => {
    if (!continentId && pendingCountryId) {
      const found = allCountries.find((c) => c.id === pendingCountryId);
      if (found?.continentId) {
        setContinentId(found.continentId);
      }
    }
  }, [pendingCountryId, continentId, allCountries]);

  /* ------------------------------
     When filteredCountries are ready, apply pending selection
  ------------------------------ */
  useEffect(() => {
    if (
      pendingCountryId &&
      filteredCountries.some((o) => o.value === pendingCountryId)
    ) {
      setCountryId(pendingCountryId);
      setPendingCountryId(""); // clear
    }
  }, [filteredCountries, pendingCountryId]);

  /* ------------------------------
     When filteredStates are ready, apply pending selection
  ------------------------------ */
  useEffect(() => {
    if (
      pendingStateId &&
      filteredStates.some((o) => o.value === pendingStateId)
    ) {
      setStateId(pendingStateId);
      setPendingStateId("");
    }
  }, [filteredStates, pendingStateId]);

  /* ------------------------------
     Submit
  ------------------------------ */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!continentId || !countryId || !stateId || !districtName.trim()) {
      Swal.fire({
        icon: "warning",
        title: t("common.warning"),
        text: t("common.all_fields_required"),
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: districtName.trim(),
        continent_id: continentId,
        country_id: countryId,
        state_id: stateId,
        is_active: isActive,
      };

      if (isEdit && id) {
        await districtApi.update(id, payload);
        Swal.fire({ icon: "success", title: t("common.updated_success") });
      } else {
        await districtApi.create(payload);
        Swal.fire({ icon: "success", title: t("common.added_success") });
      }

      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: t("common.save_failed"),
        text: err?.response?.data || t("common.unexpected_error"),
      });
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------
     JSX
  ------------------------------ */
  return (
    <ComponentCard
      title={
        isEdit
          ? t("common.edit_item", { item: t("admin.nav.district") })
          : t("common.add_item", { item: t("admin.nav.district") })
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
                setPendingCountryId("");
                setPendingStateId("");
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
                setPendingStateId("");
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
                  filteredCountries.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
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
                  filteredStates.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* District */}
          <div>
            <Label>
              {t("common.item_name", { item: t("admin.nav.district") })} *
            </Label>
            <Input
              value={districtName}
              onChange={(e) => setDistrictName(e.target.value)}
              placeholder={t("common.enter_item_name", {
                item: t("admin.nav.district"),
              })}
              className="input-validate w-full"
              required
            />
          </div>

          {/* Active */}
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
