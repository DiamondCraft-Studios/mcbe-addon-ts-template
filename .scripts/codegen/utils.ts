export function toPascalCase(id: string): string {
	const name = id.split(":")[1] ?? id;

	return name
		.split(/[_\.]/g)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join("");
}
