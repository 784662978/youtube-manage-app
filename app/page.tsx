import { ComponentExample } from "@/components/component-example";
import { Example } from "@/components/example";

export default function Page() {
    return <>
        <Example title="hello world">
            <ComponentExample />
        </Example>
    </>;
}