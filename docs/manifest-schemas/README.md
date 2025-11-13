This directory contains [JSON schemas](https://json-schema.org/) corresponding to
our dataset definitions. You can use these to learn what the format for dataset
definitions looks like, or with automated tooling to check your dataset definition
files automatically in your editor.

The `manifest` datasets are also referred to as "user datasets", whereas the other
types are also referred to as "raw datasets". Unlike raw datasets, which extract
blockchain data directly, user datasets execute user-defined SQL queries against
existing datasets' tables to create derived or transformed datasets.
