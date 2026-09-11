import type { Control, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { OrgReportingFormValues } from "@/lib/org-reporting-profile";

type ReportingForm = OrgReportingFormValues & FieldValues;

export function OrgReportingFields<T extends ReportingForm>({
  control,
}: {
  control: Control<T>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium text-foreground">Disclosure profile</div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Used on BRSR Section A, GRI 2, and GHG intensity. You can finish this later from Client profile.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field control={control} name={"cin" as Path<T>} label="CIN" placeholder="e.g. L12345MH2010PLC123456" />
        <Field control={control} name={"lei" as Path<T>} label="LEI (optional)" placeholder="20-character LEI" />
        <Field control={control} name={"gstin" as Path<T>} label="GSTIN" placeholder="15-character GSTIN" />
        <Field
          control={control}
          name={"yearOfIncorporation" as Path<T>}
          label="Year of incorporation"
          placeholder="e.g. 2012"
          inputMode="numeric"
        />
        <Field
          control={control}
          name={"registeredOfficeAddress" as Path<T>}
          label="Registered office address"
          placeholder="Street, city, PIN"
          className="sm:col-span-2"
          textarea
        />
        <Field control={control} name={"website" as Path<T>} label="Website" placeholder="https://" />
        <Field control={control} name={"email" as Path<T>} label="Entity email" placeholder="sustainability@company.com" />
        <Field control={control} name={"telephone" as Path<T>} label="Telephone" placeholder="+91 …" />
        <Field
          control={control}
          name={"stockExchanges" as Path<T>}
          label="Stock exchange(s)"
          placeholder="NSE, BSE — leave blank if unlisted"
        />
        <Field
          control={control}
          name={"paidUpCapitalInr" as Path<T>}
          label="Paid-up capital (INR)"
          placeholder="e.g. 250000000"
          inputMode="decimal"
        />
        <Field
          control={control}
          name={"employeeCount" as Path<T>}
          label="Permanent employees"
          placeholder="Headcount"
          inputMode="numeric"
        />
        <Field
          control={control}
          name={"workerCount" as Path<T>}
          label="Workers (other than employees)"
          placeholder="BRSR workers"
          inputMode="numeric"
        />
        <Field
          control={control}
          name={"annualTurnoverInr" as Path<T>}
          label="Annual turnover (INR)"
          placeholder="Latest reported turnover"
          inputMode="decimal"
          className="sm:col-span-2"
        />
        <Field control={control} name={"contactName" as Path<T>} label="Reporting contact name" placeholder="Person for BRSR / GRI queries" />
        <Field control={control} name={"contactEmail" as Path<T>} label="Reporting contact email" placeholder="name@company.com" />
        <Field
          control={control}
          name={"contactPhone" as Path<T>}
          label="Reporting contact phone"
          placeholder="+91 …"
          className="sm:col-span-2"
        />
      </div>
    </div>
  );
}

function Field<T extends ReportingForm>({
  control,
  name,
  label,
  placeholder,
  className,
  textarea,
  inputMode,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  className?: string;
  textarea?: boolean;
  inputMode?: "numeric" | "decimal" | "text";
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {textarea ? (
              <Textarea rows={2} placeholder={placeholder} {...field} />
            ) : (
              <Input placeholder={placeholder} inputMode={inputMode} {...field} />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
