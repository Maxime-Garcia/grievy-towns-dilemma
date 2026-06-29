using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class Dialogue : MonoBehaviour
{
	public string name;
	public int currentStep;

	public DialogText [] sentences;
	

	private void Update()
	{
		if (name == "Houx")
		{
			currentStep = GameObject.FindWithTag("Player").GetComponent<PlayerController>().houxStep;
		}
		
		
	}
}
