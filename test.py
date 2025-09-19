import re

# Paste your table here as a multiline string
table_text = """
Site
Status
Setpoint Mode
Active power (MW)
TSO SP received (MW)
SP sent (MW)
SP applied (MW)
SP Source
Energy Market Price
Profitability Current TH
Profitability Next TH
Voltage (kV)
Grid connection
Hour +1 (MWh)
Hour +2 (MWh)
Hour +3 (MWh)
Hour +4 (MWh)
P.O. 92 Regulation
P.O. 311 SRAP
SP By AGC (MW)
SP By AGC Active
Upper Limit (MW)
Lower Limit (MW)
(PT) Agc Activation Request
PV-SANTIZ II (PALACIOS ARZB. I)
13.13
24.96	
13.14
13.14	
AGC
49 €	--	--	
29.65
16.39
15.51
15.02
13.11
13.14
1
SAT-WF CALDERA
-0.12
22.5	
0.25
0.29	
AGC
49 €			
132.33
2.14
4.02
5.43
5.56
0.25
1
SAT-WF TESOSANTO
3.17
50	
3.54
3.54	
AGC
49 €	--	--	
225.98
10.75
13.96
16.79
21.61
3.54
1
SAT-WF SIERRA DE LAS CARBAS
4.17
40	
4.56
4.98	
AGC
49 €			
226.42
7.61
11.75
14.19
16.77
4.56
1
PV-SIERREZUELA
28.44
38.2	
28.55
28.55	
AGC
49 €	--	--	
30.63
30.65
30.83
30.64
30.17
28.55
1
PV-LERAPA (TORDESILLAS III)
1.24
11.57	
1.39
1	
AGC
49 €	--	--	
223.86
7.79
7.17
6.49
5.72
1.39
1
PV-SANTIZ III (VALDELOSA I)
 
1.99
24.96	
1
24.96	
AGC
49 €	--	--	
29.66
17.8
16.72
15.69
13.43
1
1
PV-MANZANARES
12.58
23.8	
13.13
13.13	
AGC
49 €	--	--	
30.15
22.54
22.06
21.43
19.9
13.13
1
PV-HERCULES
16.42
24.18	
16.43
16.43	
AGC
49 €	--	--	
65.8
17.14
15.29
13.71
12.29
16.43
1
PV-EL BALDIO
2.43
16.14	
2.49
2.5	
AGC
49 €	--	--	
46.31
9.58
8.75
7.66
5.68
2.49
1
PV-ALCAZAR1
11.6
27	
11.77
11.77	
AGC
49 €	--	--	
30.9
25.44
25.05
24.29
23.48
11.77
1
PV-ALCAZAR2
14.7
26.6	
14.94
14.94	
AGC
49 €	--	--	
30.9
25.88
25.46
24.8
23.83
14.94
1
PV-ROBLEDO
21.58
38.05	
21.76
21.76	
AGC
49 €	--	--	
30.71
31.52
31.29
30.85
30.16
21.76
1
PV-EMOCION
20.19
38.1	
20.12
20.12	
AGC
49 €	--	--	
30.35
31.91
31.82
31.36
30.36
20.12
1
PV-ENVITERO
17.96
35	
18.15
18.15	
AGC
49 €	--	--	
30.51
28.18
26.36
25.4
25.34
18.15
1
PV-ESCARNES
17.69
32.8	
17.86
17.86	
AGC
49 €	--	--	
30.65
26.18
25.9
25.33
24.59
17.86
1
PV-ESCATRON
22.28
38	
22.33
22.33	
AGC
49 €	--	--	
30.74
32.05
31.57
30.67
29.57
22.33
1
PV-ESPLENDOR
24.56
40.2	
24.73
24.73	
AGC
49 €	--	--	
30.5
31.43
31.1
30.26
29.18
24.73
1
PV-HAZAÑA
20.32
38.1	
20.39
20.39	
AGC
49 €	--	--	
30.35
31.73
31.07
30.35
29.3
20.39
1
PV-ICTIO ALCAZAR 1
30.73
32.2	
32.2
32.2	
TSO
49 €	--	--	
30.61
30.56
30.18
28.95
27.69
5
-1
PV-ICTIO ALCAZAR 2
30.77
31.5	
31.5
31.5	
TSO
49 €	--	--	
30.61
29.85
29.8
29.23
27.85
5
-1
PV-ICTIO ALCAZAR 3
31.96
31.8	
31.8
31.8	
TSO
49 €	--	--	
30.61
29.14
29.08
28.39
27.07
44.4
-1
PV-IGNIS
20.84
37.9	
20.77
20.77	
AGC
49 €	--	--	
30.66
31.54
31.2
30.92
30.44
20.77
1
PV-LOGRO
26.5
44.1	
26.52
26.52	
AGC
49 €	--	--	
30.52
34.48
34.05
33.65
32.52
26.52
1
PV-MEDIOMONTE
31.72
37.95	
37.95
37.95	
TSO
49 €	--	--	
30.95
32.3
31.86
31.14
30.2
37.95
-1
PV-MOCATERO
17.3
30.35	
17.32
17.32	
AGC
49 €	--	--	
30.54
26.2
26.19
25.74
24.84
17.32
1
PV-PALABRA
19.63
40.2	
19.86
19.86	
AGC
49 €	--	--	
30.7
31.41
31.15
30.64
29.97
19.86
1
PV-RIBAGRANDE
30.03
38.1	
30.13
30.13	
AGC
49 €	--	--	
30.71
30.98
31.21
31.14
30.18
30.13
1
PV-TALENTO
24.25
38.2	
24.31
24.31	
AGC
49 €	--	--	
30.38
32.03
31.52
30.85
29.79
24.31
1
PV-VALDECARRO
16.1
30.7	
16.38
16.38	
AGC
49 €	--	--	
30.9
28.78
27.87
26.51
26.22
16.38
1
PV-VALDELAGUA
26.06
40.45	
26.11
26.11	
AGC
49 €	--	--	
30.74
31.96
31.67
31.24
30.47
26.11
1
PV-VALDIVIESO
15.4
31.6	
15.88
15.88	
AGC
49 €	--	--	
30.9
"""

# Step 1: extract all floats from the text
numbers = re.findall(r"[-+]?[0-9]*\.?[0-9]+", table_text)

# Step 2: keep only the Active Power values
# These are the numbers that appear right after each site name
active_powers = []
lines = table_text.strip().splitlines()
for i, line in enumerate(lines):
    if line.startswith("PV-") or line.startswith("SAT-"):
        try:
            val = float(lines[i+1].strip())
            active_powers.append(val)
        except:
            pass

# Step 3: sum them up
total_active_power = sum(active_powers)

print("Active power values:", active_powers)
print("Total active power (MW):", total_active_power)
